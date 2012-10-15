---
layout: default
title: JQuery + RequireJS
tags: jquery web
---

{% include title.md %}

最近弄的一個項目, 由於項目主體框架使用的是Primeface, 因此前端自動引入了jQuery. 

在寫了一些代碼之後, 發現有不少函數是可以抽取出來公用的, 不過將這些函數放到單獨的文件又帶來一個比較麻煩的問題, 就是每次需要用到的時候, 都需要在頁面將對應的文件引入, 很是麻煩(因為這些函數也不是每一個頁面都會用到, 所以不想直接放在公共文件include).

由於之前看到過RequireJS, 稍微瞭解一點這個東東, 而且之前一個項目使用Dojo, 使用了AMD 的方式管理JS 文件的依賴關係, 因此這次很自然地想到使用RequireJS 來解決前面這個問題.

首先從[requirejs.org](http://requirejs.org/) 下載了最新的2.0.6 版, 也查看了一下RequireJS 裏面和jQuery 集成的sample, 只是發現這個例子裏面的jQuery 是經過一些處理的, 不過在[require-jquery](https://github.com/jrburke/require-jquery) 查看了一下對應的源代碼發現, 其實原理並不難理解, 最關鍵是最後面的兩行:

    {% highlight js linenos %}
    if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
        define( "jquery", [], function () { return jQuery; } );
    }
    {% endhighlight %}

在這裡定義了一個jquery 的模塊, 使得可以再外面進行引用, 但是由於我現在項目的jQuery 是Primeface 直接給引入的, 我已經不需要再引入一個[require-jquery](https://github.com/jrburke/require-jquery) 了, 該怎麼辦呢?

琢磨了一下, 覺得可以直接參考[require-jquery](https://github.com/jrburke/require-jquery) 的實現, 於是進行嘗試.

- 首先新建一個jquery.js 的文件
- 文件的內容很簡單, 和上面的也比較類似:

        {% highlight js linenos %}
        define( [], function() {
            return window.jQuery;
        });
        {% endhighlight %}

- 在需要使用到jQuery 的js 文件a.js, 直接require 這個jquery:

        {% highlight js linenos %}
        require( ["./pathto/jquery", "otherjs"], function($, otherjs) {
            // implement code here
        });
        {% endhighlight %}

測試比較簡單, 將上面這個a.js 通過[requirejs.org](http://requirejs.org/) 引入頁面最後面, 參考[requirejs.org](http://requirejs.org/) 上的做法, 如下:

    {% highlight html linenos %}
    <script src="pathto/require.js" type="text/javascript" data-main="pathto/a.js"></script>
    {% endhighlight %}

完畢!