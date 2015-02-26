---
layout: default
title: AngularJS Performance
tags: AngularJS, Performance
---

{% include title.md %}

#### 艰难历程

系统里面使用AngularJS 做了一个类似Trello 的看板页面, 用来显示任务列表. 但是发现, 打开任务详情几次之后, 就非常卡了.

1. 最初以为是看板里面元素太多, 造成ng-repeat 性能下降引起的问题. 于是升级了一下Angular 的版本到1.3, 并使用其中的`bind once` 的特性来绑定页面上那些不会再变化的内容.

1. 尝试使用Developer Tool 里面的Profile, 结果不会用. 看不出对象是不是释放掉了.

    ![对象太多, 完全找不到了](/img/Angular Performance/profile-cannot-find-object.png)

    图: 对象太多, 完全找不到了

1. 使用了个笨办法, 在任务的对象放一个很大的数组.

    ```js
    function alloc() {
        var largeObject = [];
        for (var i = 0; i < 1000000; i++) {
            largeObject.push(10000000 * i + "?");
        }
        return largeObject;
    }
    $scope.task.largeArray = alloc();
    ```

    这下效果明显了. 然后就发现, 任务详情的窗口关闭之后, task 对象还一直存在.

    ![Task 对象不能被释放](/img/Angular Performance/profile-task-cannot-release.png)

    图: Task 对象不能被释放

    一开始还以为是Profile 的时候没有GC 的关系, 但是后来看文档发现, 进行Profile 会自动先进行GC.

1. 是什么引起task 对象不能释放呢? 首先怀疑是`$modal`. 会不会是这里面有什么bug?

    于是写了个简单的页面来进行测试:

    ```js
    $scope.modal = function modal() {
        $modal.open({
            templateUrl: 'angular/views/modal.html',
            controller: function ModalCtrl($scope, $modalInstance) {
                $scope.modalLargeObject = alloc();

                $scope.close = function close() {
                    $modalInstance.close($scope.modalLargeObject);
                };
            }
        }).result.then(function() {
            console.info('close');
        }, function() {
            console.info('dismiss');
        });
    };
    ```

    ![多次弹出Modal 的Profile](/img/Angular Performance/profile-modal.png)

    图: 多次弹出Modal 的Profile

1. 对Profile 界面上的几个列不太明白是干啥的, 找了一下:

    **`Shallow size`**

    This is the size of memory that is held by the object itself.

    对象本身占用内存的大小，不包含对其他对象的引用.

    **`Retained size`**

    This is the size of memory that is freed once the object itself is deleted along with its dependent objects that were made unreachable from GC roots.

    该对象被 GC 之后所能回收到内存的总和.

	<table style="border: none;"><tr>
		<td><img src="/img/Angular Performance/retained-objects-1.png" /></td>
		<td><img src="/img/Angular Performance/retained-objects-2.png" /></td>
	</tr></table>

    从 obj1 入手，图中蓝色节点代表仅仅只有通过 obj1 才能直接或间接访问的对象。因为可以通过 GC Roots 访问，所以左图的 obj3 不是蓝色节点；而在右图却是蓝色，因为它已经被包含在 retained 集合内。

    所以对于左图， obj1 的 retained size 是 obj1, obj2, obj4 的 shallow size 总和；右图的 retained size 是 obj1, obj2, obj3, obj4 的 shallow size 总和。 obj2 的 retained size 可以通过相同的方式计算。

1. 那到底是什么原因, 使得Task 不能被释放呢? 该如何定位问题?

    我还是使用最笨的办法, 先把任务详情的html 和Controller 里面的内容都注释掉, 然后一点点放开, 看到底是哪一部分使得内存无法释放.

    经过好长好长好长...一段时间的折腾, 终于发现问题点:

    ```js
    // 好多个directive 都有这样的代码
    element.parents().click(function(){
        $scope.closePanel();
        $scope.$apply();
    });
    ```

    这里面的问题是什么?

    给element 的所有parent (包括document.body) 都绑定了click 事件. 那么Modal 关闭之后, 这个事件绑定还存在, 这样的话, 这个事件引用到的资源就无法释放了.

    这里还涉及到闭包.

    **`Closures / 闭包`**

    Closures are functions that refer to independent (free) variables. 

    In other words, the function defined in the closure **'remembers'** the environment in which it was created.

    ```js
    function startAt(x) {
        function incrementBy(y) {
            return x + y;
        }
        return incrementBy;
    }

    var closure1 = startAt(1);
    var closure2 = startAt(5);
    ```

    既然发现问题, 于是进行调整:

    ```js
    function closeHandler = function(){
        $scope.closePanel();
        $scope.$apply();
    };
    var parents = element.parents();
    parents.on("click", closeHandler);

    $scope.$on("$destroy", function() {
        // 当$scope 销毁的时候, 解除这些事件绑定
        parents.off("click", closeHandler);
    })
    ```

    把这样的都修改完, 然后进行测试, 内存基本上比较平稳了. Profile 也不会出现大量无法释放的Task 对象. 观察Chrome 的Task Manager 里面的JavaScript Memory 变化, 内存能够得到释放(上涨了一段之后, 会进行回收, 释放后的内存使用量和开始时差不多).

    ![Task Manager 的JavaScript Memory](/img/Angular Performance/taskmanager-jsmemory.png)

    图: Task Manager 的JavaScript Memory

#### 另一个性能问题

任务列表里面, 点击任务名称, 要等很长时间(1 分多钟)才会弹出任务详情.

这个感觉跟内存没有关系了, 于是尝试使用Developer Tool 里面的Timeline 来看这一段时间发生了什么事.

![TaskName 花了很多时间执行](/img/Angular Performance/timeline-tasklist.png)

图: TaskName 花了很多时间执行

看下代码:

```js
$timeout(function() {
    $scope.isMultiRow = elem.height() > LINE_HEIGHT;
    Tasks.length = 0;
}, 0);
```

看来是因为任务数量多的时候这里触发太多次消息循环了(`$timeout` 默认情况下会触发AngularJS 的消息循环).

这个代码和一个界面设计有关, 在和需求商量之后, 把这个`$timeout` 处理去掉了.

如果`$timeout` 里面的代码不需要触发消息循环, 那么应该给`$timeout` 调用加上第三个参数, 并传递`false` 过去.

```js
$timeout(function() {
    // code
}, 0, false);
```

#### 几个小技巧

1. 在Developer Tool 的console 面板里面, 可以用$0, $1, ..., $4, 来引用在element 面板最近点击到的元素.

    ![在element 上选取元素](/img/Angular Performance/$0-element.png)

    图: 在element 上选取元素

    ![在console 上使用$0 获取dom](/img/Angular Performance/$0-console.png)

    图: 在console 上使用$0 获取dom

1. console.time

    ```js
    console.time("Array initialize");
    var array= new Array(1000000);
    for (var i = array.length - 1; i >= 0; i--) {
        array[i] = new Object();
    };
    console.timeEnd("Array initialize");
    ```

    ![console.time 输出](/img/Angular Performance/console-time.jpg)

    图: console.time 输出

##### 参考

1. <https://developer.chrome.com/devtools/docs/javascript-memory-profiling>

1. <http://www.cnblogs.com/Wayou/p/chrome-console-tips-and-tricks.html>

1. <http://www.slideshare.net/gonzaloruizdevilla/finding-and-debugging-memory-leaks-in-javascript-with-chrome-devtools>

1. <http://en.wikipedia.org/wiki/Closure_\(computer_programming\)>

1. <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures>

1. <http://www.ibm.com/developerworks/web/library/wa-memleak>