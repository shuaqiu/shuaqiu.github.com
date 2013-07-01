---
layout: default
title: Hibernate Search (Part 1)
tags: Hibernate Search, Lucene
---

{% include title.md %}

今天參加了一個面試, 聊到了差不多去年這個時候做的全文搜索功能, 感覺自己總結得實在是太少了, 明明知道的一些東西， 問起來卻總是一下答不上來...

業務場景其實不算複雜, 要做到類似Google 搜索那樣, 通過一個輸入框來搜索系統中多個表/ 多個字段中包含了所輸入內容的記錄集, 也就是在幾個表的字段中, 如果包含了輸入的內容, 那麼對於的記錄就是符合的.

因爲主要的業務對象是數據庫, 而不是文檔, 所以技術選型的結果就是使用Hibernate Search 來實現這個全文搜索功能, 主要是基於下面幾點考慮:

1. Hibernate Search 跟Hibernate 結合得更緊密, 可以直接通過Hibernate 實體類來操作Lucene 的索引, 只需要實體類中添加Annotation, 然後在Hibernate 配置文件中添加listener, 即可以在數據新增/ 修改/ 刪除時自動更新索引

2. 數據查詢同樣可以借助Hibernate, 減少了從索引中獲取數據後再轉折去查詢數據庫的操作

由於內容較多, 這一節先只介紹索引的處理.

- 首先當然就是添加Hibernate Search 的依賴了

- 在要創建Lucene 索引的實體類中添加Annotation, 如下:

    {% highlight java linenos %}
    @Document
    public class Device {
        @Id
        private long id;
        
        @Index(name="name")
        private String name;
        
        private String type;
        
        //... getter setter
    }
    {% endhighlight %}

    {% highlight java linenos %}
    @Document
    public class Alarm {
        @Id
        private long id;
        
        @Index(name="name")
        private String name;
        
        @EmbedIndex(name="device")
        private Device device;
        
        //... getter setter
    }
    {% endhighlight %}

    > 這裏, 主要是@Index 的Annotation, 其中的name 屬性即是生成的Lucene 字段名稱

- 接下來自然是Hibernate 的配置文件了, 和正常的配置文件差不多, 除了要添加Lucene 的索引保存路徑, 如果要在新增/ 修改/ 刪除實體時自動更新索引, 還需要添加listener.

    {% highlight xml linenos %}
    <property name="hibernate.search.index>
    {% endhighlight %}

- 如果配置了listener, 那麼這樣就可以了, 在實體內容發生變化時, 會自動更新對於的索引.