---
layout: default
title: Hibernate Search (Part 1)
tags: Hibernate Search, Lucene
---

{% include title.md %}

今天參加了一個面試, 聊到了差不多去年這個時候做的全文搜索功能, 感覺自己總結得實在是太少了, 明明知道的一些東西， 問起來卻總是一下答不上來...

業務場景其實不算複雜, 就是要做到類似Google 搜索那樣, 通過一個輸入框來搜索系統中多個表/ 多個字段中包含了所輸入內容的記錄集, 也就是在幾個表的字段中, 如果包含了輸入的內容, 那麼對於的記錄就是符合的.

因爲主要的業務對象是數據庫, 而不是文檔, 所以技術選型的結果就是使用Hibernate Search 來實現這個全文搜索功能, 主要是基於下面幾點考慮:

1. 主要的業務對象並不是文檔, 而是數據庫

2. Hibernate Search 跟Hibernate 結合得更緊密, 可以直接通過Hibernate 實體類來操作Lucene 的索引, 只需要實體類中添加Annotation, 然後在Hibernate 配置文件中添加listener, 即可以在數據新增/ 修改/ 刪除時自動更新索引.

3. 數據查詢同樣可以借助Hibernate, 減少了從索引中獲取數據後再轉折去查詢數據庫的操作.

由於內容較多, 這一節先只介紹索引的處理.

- 首先當然就是添加Hibernate Search 的依賴了

- 在要創建Lucene 索引的實體類中添加Annotation, 如下:

    {% highlight java linenos %}
    @Indexed
    public class Device {
        @DocumentId
        private long id;
        
        @Field(name = "deviceNname", index = Index.TOKENIZED, store = Store.YES)
        private String name;
        
        private String type;
        
        //... getter setter
    }
    {% endhighlight %}

    {% highlight java linenos %}
    @Indexed
    public class Alarm {
        @DocumentId
        private long id;
        
        @Field(name = "alarmName", index = Index.TOKENIZED, store = Store.YES)
        private String name;
        
        @IndexedEmbedded
        private Device device;
        
        //... getter setter
    }
    {% endhighlight %}

    這裏, 主要是@Field 的Annotation, 其中的name 屬性即是生成的Lucene 字段名稱

- 接下來自然是Hibernate 的配置文件了, 和正常的配置文件差不多, 除了要添加Lucene 的索引保存路徑, 如果要在新增/ 修改/ 刪除實體時自動更新索引, 還需要添加listener.

    {% highlight xml linenos %}
    <!-- 配置索引的保存方式, 這裡配置為使用文件進行保存 -->
    <property name="hibernate.search.default.directory_provider">org.hibernate.search.store.FSDirectoryProvider</property>
    <!-- 配置索引的保存路徑 -->
    <property name="hibernate.search.default.indexBase">./var/lucene/indexes</property>
    <!-- 是否使用listener 監聽實體的改變 -->
    <property name="hibernate.search.autoregister_listeners">true</property>
    {% endhighlight %}

    {% highlight xml linenos %}
    <!-- 這裡沒有直接使用hibernate 的配置方式了, 如果使用spring 進行配置, 則更加簡單 -->
    <event type="post-update">
        <listener class="org.hibernate.search.event.FullTextIndexEventListener" />
    </event>
    <event type="post-insert">
        <listener class="org.hibernate.search.event.FullTextIndexEventListener"/>
    </event>
    <event type="post-delete">
        <listener class="org.hibernate.search.event.FullTextIndexEventListener"/>
    </event>
    
    <event type="post-collection-recreate">
        <listener class="org.hibernate.search.event.FullTextIndexEventListener"/>
    </event>
    <event type="post-collection-remove">
        <listener class="org.hibernate.search.event.FullTextIndexEventListener"/>
    </event>
    <event type="post-collection-update">
        <listener class="org.hibernate.search.event.FullTextIndexEventListener"/>
    </event>
    <event type="flush">
        <listener class="org.hibernate.event.def.DefaultFlushEventListener"/>
    </event>
    {% endhighlight %}

- 如果像上面那樣配置了listener, 那麼這樣就可以了, 在實體內容發生變化時, 會自動更新對於的索引. 如果不自動監聽實體的改變, 那麼就需要自己在實體改變的時候去更新索引.

    {% highlight java linenos %}
    Session session = null; // ... get session;
    FullTextSession fullTextSession = Search.getFullTextSession(session);
    Transaction tx = fullTextSession.beginTransaction();
    // 新建/ 更新索引
    fullTextSession.index(po);
    // 刪除索引
    // fullTextSession.purge(po.getClass(), po.getId());
    tx.commit();
    {% endhighlight %}

至此, 創建索引的操作就算是完成了, 這比直接使用Lucene 要簡單很多.