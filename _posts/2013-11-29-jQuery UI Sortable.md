---
layout: default
title: jQuery UI Sortable 使用介绍
tags: jQuery UI, Sortable
---

{% include title.md %}

#### 什么是Sortable

Enable a group of DOM elements to be sortable. Click on and drag an element to a new spot within the list, and the other items will adjust to fit.

允许一组DOM元素可排序. 点击并拖动元素到列表中的新位置, 而其他元素将调整以适应.

#### 先来一个简单的示例 - 一个任务列表

1. 页面内容

    ```html
    <h4>重要</h4>
    <div class="list-group" data-priority="2">
        <div data-id="{{ item.id }}" ng-repeat="item in items | filter : {priority : 2}" class="row alert alert-warning">
            <div class="col-xs-8 item-content">{{ item.content }}</div>
            <div class="col-xs-4 text-right text-muted small">{{ item.time | date : "yyyy-MM-dd"}}</div>
        </div>
    </div>
    <h4>普通</h4>
    <div class="list-group" data-priority="1">
        <div data-id="{{ item.id }}" ng-repeat="item in items | filter : {priority : 1}" class="row alert alert-success">
            <div class="col-xs-8">{{ item.content }}</div>
            <div class="col-xs-4 text-right text-muted small">{{ item.time | date : "yyyy-MM-dd"}}</div>
        </div>
    </div>
    ```

1. 脚本

    ```js
    $('.list-group').sortable({
        connectWith: '.list-group', // 可以拖动其他的列表
        cursor: 'move', // 鼠标指针
        placeholder: 'alert alert-info', // 放置位置的样式
        revert: 20, // 松开后的动画时长
        handle: '.item-content', // 可以拖动的元素, 这里要注意, 上面第二个列表没有包含.item-content, 这就导致第二个列表不能拖动了.
    })
    // 禁用一下选择, 避免拖动时把文本也选中了.
    .disableSelection();
    ```

#### 简单解析

1. connectWith

    A selector of other sortable elements that the items from this list should be connected to.

    如果需要将当前列表的元素, 拖动到其他列表去, 则需要用这个选项来指定"其他列表" 的selector. 取值为:selector. 例如上面的:

    ```js
    connectWith: '.list-group'
    ```

    需要注意的是, 这个只是单向的, 也就是说如果"其他列表" 的元素要能够拖放到当前列表, "其他列表" 也需要进行这样的设置才行.

1. cursor

    Defines the cursor that is being shown while sorting.

    拖动时的鼠标指针, 这里直接是样式值, 而不是css class. 默认是auto(也就是普通指针). 比如下面将鼠标指针改为"移动" 的样式:

    ```js
    cursor: 'move'
    ```

1. placeholder

    A class name that gets applied to the otherwise white space.
    
    在拖动时, 元素可以放置的位置的样式. 比如:

    ```js
    placeholder: 'alert alert-info'
    ```

1. revert

    Whether the sortable items should revert to their new positions using a smooth animation.

    定义拖动的元素在松开后, 到达新位置的时长. 可能的取值是:

        + false (默认值), 则没有时长, 直接到达新位置.

        + true, 则使用默认的时长.

        + 数值, 使用指定的时长, 单位是毫秒(milliseconds)

    例如:
    
    ```js
    revert: 20
    ```

1. handle

    Restricts sort start click to the specified element.

    限制可以拖动的位置, 限定为指定的元素. 取值为: selector / element. 比如:

    ```js
    handle: '.item-content'
    ```

    这里要注意的是, 如果可以排序的元素里面没有这个限定的元素(比如上面示例中的第二个列表), 则没办法再进行排序了.

#### 保存结果

上面的例子, 只是可以进行列表的排序. 但是我们往往需要将排序结果保存起来. 这个可以通过toArray 方法进行处理. 直接上代码:

```js
$('.list-group').on('sortstop', function(event, ui) {
    var $this = $(this);
    // 由于在上面的列表, 通过data-id 来指定id 的, 所以要传递参数
    // 如果是使用id, 则直接可以使用: $(this).sortable('toArray')
    var idArr = $this.sortable('toArray', {attribute : 'data-id'});

    $.post(saveOrderUrl, {
        idArr: idArr
    }, function(result) {
        // ...
        if (result.isOk == false) {
            // 保存失败了, 还原吧...
            $this.sortable('cancel');
            // 可能还需要提示一下, 因为还原的效果很不明显.
            // ...
        }
    });
});
```

这里, 直接在stop 事件进行保存的, 并且在保存失败时, 取消当前的排序操作, 把拖动的元素还原回原来的位置.

再来看一下这里面的东东

1. stop 事件

    排序已经停止时触发的事件. 方法的参数

    在jQuery UI, 事件的绑定, 可以使用上面那种方式, 在初始化之后进行设置.
    也可以直接在初始化的时候进行, 比如上面的stop 事件也可以这样绑定:

    ```js
    $('.list-group').sortable({
        // ...
        stop: function(event, ui) {
            // ...
        },
    }
    ```

1. toArray 方法

    Serializes the sortable's item id's into an array of string.

    返回一个字符串的数组, 保存可排序的元素的id(默认是获取id), 比如:

    ```js
    $('.list-group').sortable('toArray')
    // 由于上面没有id 属性, 则会返回类似这样的数组: ['', '', '']
    ```

    如果要获取其他属性, 则可通过参数来指定. 例如上面例子中用来获取data-id 属性.

    另外, 需要注意 的是, jQuery UI 的方法调用, 是通过下面的形式进行的:

    ```js
    $('.list-group').sortable('方法名', '方法参数')
    ```

    而不是通常的:

    ```js
    $('.list-group').方法名('方法参数')
    ```

1. cancel 方法

    Cancels a change in the current sortable and reverts it to the state prior to when the current sort was started. Useful in the stop and receive callback functions.

    取消当前的排序操作, 并将元素还原到拖动之前的位置. 例如上面例子中保存失败时的处理.

#### 再来扩展一下

现在在上面的例子基础上, 扩展一下, 想限制一些元素的排序, 比如第一个列表中符合一定条件(这里假定是data-id < 10 ) 的元素不能放到第二个列表.

首先很快就可以想到, 完全可以用上面的方法, 在stop 事件里面, 增加判断, 如果符合条件, 则调用cancel 方法取消排序操作.

但能不能直接就限制这样的元素, 不给在第二个列表放置呢?

首先再来看一下Sortable 的选项, 看有没有选项能达成限制的需求. 翻阅文档, 有两个和可排序的元素有关:

+ items: 指定列表中可以拖动排序的元素, 取值为selector, 默认是> *(列表的所有直接子元素)
+ cancel: 限制一些元素的拖动, 取值为selector, 默认为input,textarea,button,select,option. 当有一些元素是和可以拖动的元素是同一级别的DOM 时, 通过这个选项来排除这些元素的拖动.

但仔细分析一下, 这些都不是我们想要的(这些都是针对整个列表的). 那只能自己写代码控制了.

从前面的介绍也知道, connectWith 是设置排序可以放到其他列表去的. 现在要限制第一个列表的元素, 那么很自然的思路就是, 我在开始拖动的时候, 判断拖动的元素, 是否可以放到第二个列表, 如果不能, 则将第二个列表从connectWith 中排除掉:

```js
$('.list-group:eq(0)').on('sortstart', function(event, ui) {
    var $this = $(this);
    var dataId = ui.item.data('id');
    var oldConnectWith = $this.data('connectWith');
    if (dataId < 10 && oldConnectWith == null) {
        var connectWith = $this.sortable('option', 'connectWith');
        $this.data('connectWith', connectWith);
        $this.sortable('option', 'connectWith', $(connectWith).not('[data-priority="1"]'));
    } else if (dataId >= 10 && oldConnectWith) {
        $this.sortable('option', 'connectWith', oldConnectWith);
        $this.removeData('connectWith');
    }
});
```

#### 先来看一下

暂时先不管这段代码是否可以达到要求, 先看看这个例子里面的东东. 首先就是

1. option 方法

    这个或者可以说是最重要的一个方法了. 这个方法类似jQuery 的css 等方法, 有下面这样几种调用方式:
    
    > + option(optionName): 获取指定option 的值.
    > 
    > + option(optionName, optionValue): 设置option 的值.
    > 
    > + option(options): 和上面的类似, 都是设置option 值, 
    > 
    >     但是这个方式可以支持多个option 的设置, 例如:
    > 
    >     ```js
    >     $('.list-group').sortable('option', {
    >         disable : true // 禁用排序
    >     });
    > 
    > + option(): 获取所有的option, 返回一个很长串的对象. 实际意义并不是很大, 调试的时候会有些用.

1. start 事件

    拖动开始时触发的事件.

    有问题啊

    再回过头运行上面的代码, 会发现有问题, 设置connectWith 的效果要到下一个元素的排序才有用, 当前的拖动不起作用.

    经过一番分析, 查看源代码, 发现在start 事件里面, 元素可以放置的列表已经通过connectWith 属性设置计算好了. 这个时候再进行设置, 当然就只有下一次才起作用了.

    不过幸好还有补救的办法, 先来看一下修改后的代码:

    ```js
    $('.list-group:eq(0)' ).on('sortstart', function(event, ui) {
        var $this = $(this);
        var dataId = ui.item.data('id');
        var oldConnectWith = $this.data('connectWith');
        if (dataId < 10 && oldConnectWith == null) {
            var connectWith = $this.sortable('option', 'connectWith');
            $this.data('connectWith', connectWith);
            $this.sortable('option', 'connectWith', $(connectWith).not('[data-priority="1"]'));
            // 增加这个方法的调用
            $this.sortable('refresh');
        } else if (dataId >= 10 && oldConnectWith) {
            $this.sortable('option', 'connectWith', oldConnectWith);
            // 增加这个方法的调用
            $this.sortable('refresh');
            $this.removeData('connectWith');
        }
    });
    ```

    这里主要是增加对refresh 方法的调用. 这个效果可以再http://embed.plnkr.co/OHXmZ3/preview 看到

1. refresh

    Refresh the sortable items. Triggers the reloading of all sortable items, causing new items to be recognized.

    刷新可排序的元素, 重新加载所有可排序的元素, 使得新的元素可以被识别. 这个方法没有参数.

    查看源代码发现这个方法会重新计算可以排序的元素, 也会计算可以放置的列表. 在上面调用这个方法, 重新刷新一下.

OK, 差不多就这样了. 末了, 再补充一点点

#### 附

1. 其他一些选项

    > + disabled: 取值为boolean, 如果设置为true, 则直接禁用整个列表的排序功能.
    > 
    > + helper: 在拖动时, 跟随鼠标移动的元素, 取值为: original (默认值, 直接拖动元素), clone(复制一个新的元素), function(){...}(使用函数返回的元素).
    > 
    > + axis: 可以指定为x 或y, 来限定只能进行一个方向上的拖动
    > 
    > + zIndex: 设置拖动元素的z-index, 取值为数值, 默认是1000

1. 从选项可以看出的一点东西

    > 从上面的选项, 可以看出, Sortable 在进行拖动排序时:
    > 
    > + 根据items / cancel / handle 属性的设置, 给列表的元素绑定拖动事件.
    > 
    > + 在进行拖动时, 根据helper 设置处理跟随鼠标拖动的元素. 并根据当前鼠标的位置, 以及connectWith 设置, 计算可以进行放置的位置, 并在该位置创建placeholder, 如果有设置placeholder 样式, 则会将该样式应用上去.
    > 
    > + 松开鼠标时, 将元素放到当前placeholder 的位置.

1. 关于事件

    > Sortable 有不少事件, 前面也介绍了其中的start 和stop. 不过Sortable 还有不少其他事件.
    > 
    > 通过测试, 如果是在列表内容拖动, 则是这样一个过程:
    > 
    > + start --> 拖动开始时触发.
    > 
    > + activate --> 在start 事件之后, 拖动的元素所有可以放置的列表都会触发这个事件. 这里所有可以放置的列表: 首先是元素本身所在的列表, 另外, 如果指定了connectWith 参数, 则还包括connectWith 参数指定的所有列表.
    > 
    > + sort --> 在拖动时会不停触发, 意义不大.
    > 
    > + change --> 当元素的位置发生变化时触发, 会有多次产生(只要放置的位置变了就触发, 也就是说会触发多次, 感觉实际意义不大).
    > 
    > + beforeStop --> 停止之前, 在helper /placeholder 还存在时触发(我的理解是在刚刚松开鼠标时触发的).
    > 
    > + update --> 在停止排序, 并且元素位置已经改变之后触发.
    > 
    > + deactivate --> 和activate 类似, 所有可以放置的列表都会触发这个事件.
    > 
    > + stop --> 排序已经停止时触发, 可以通过cancel 方法取消当前的排序操作.
    > 
    > 如果在在多个列表之间拖动, 则还会再触发over (进入到另外一个列表), out(从一个列表离开), remove /receive(元素从一个列表放到另一个列表时, 这两个列表分别触发的事件) 这些事件.

再其他的, 自己看API 了.
