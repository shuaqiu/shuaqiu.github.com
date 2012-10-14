---
layout: default
title: Using Headless Virtualbox
tags: Virtualbox
---

{% include title.md %}

在Gentoo 系統裡面安裝了VirtualBox, 由於不想增加QT 的依賴, 因此去掉了圖形界面, 直接使用Headless 的方式, 也就是使用命令行來管理虛擬機了...

不過之前一直都是使用GUI, 突然換成命令行, 還真的相當不習慣呢...下面是嘗試創建一個XP 的虛擬機...

- 創建虛擬機

    > 首先當然是先創建一個虛擬機了, 使用命令:
    > 
    >     VBoxManage createvm --name xp --ostype WindowsXP --register --basefolder VirtualBox\ VMs/xp
    > 
    > 這裡我是弄複雜了, 其實可以不需要再指定basefolder 了的, 命令會直接在默認的目錄下創建虛擬機的文件(會用虛擬機名創建文件夾先)...命令執行完成之後, 可以在對應目錄下找到名字為xp.vbox 的文件...
    > 
    > 如果不確定虛擬機是否創建成功了, 可以使用命令查看當前的虛擬機列表:
    > 
    >     VBoxManage list vms

- 修改虛擬機的網卡

    > 因為我都是使用Bridge Adapter 方式進行鏈接的, 因此使用命令:
    >
    >     VBoxManage modifyvm xp --bridgeadapter1 wlan0
    >
    > 添加一個Bridge 類型的網卡, 注意這裡bridgeadapter1 中間是沒有空格的, 當然根據實際的情況, 可以換成1-4 中的一個.

- 磁盤控制器

    > 接下來是添加磁盤控制器, 使用命令:
    >
    >     VBoxManage storagectl xp --name "IDE Controller" --add ide --controller PIIX4 --bootable on
    >
    > 這裡name 屬性是必須的, 值倒是無所謂, 隨便自己取名了...
    >
    > 添加磁盤控制器也是折騰了一陣, 一開始使用了下面的命令:
    >
    >     VBoxManage storagectl xp --name "SATA Controller" --add sata --controller PIIX4 --bootable on
    >
    > 想使用ICH6 的sata 控制器的, 結果不知道是我的機器不支持還是怎麼的, 出現錯誤, 於是改回使用PIIX4 了...

- 磁盤

    > 添加磁盤, 找了好久命令說明, 發現沒有命令可以直接給虛擬機添加硬盤, 只能先創建硬盤, 然後通過其他命令綁定...創建磁盤使用命令:
    >
    >     VBoxManage createhd --filename xp --size 20000 --format VMDK --variant Split2G
    >
    > 在當前目錄下創建了一個20G 的VMDK 硬盤, 這個硬盤會拆分成10 個硬盤文件, 每個2G...這裡我以為也是不用指定目錄, 沒想到創建磁盤直接是把磁盤文件放在當前目錄了, 搞得我只好又手動將這些文件移動到虛擬機的目錄下...
    >
    > 可以使用命令查看當前的硬盤列表:
    >
    >     VBoxManage list hdds

-  綁定硬盤

    > 將硬盤和虛擬機綁定, 找了好久, 最後才發現原來是使用下面的命令:
    >
    >     VBoxManage storageattach xp --storagectl "IDE Controller" --port 0 --device 0 --type hdd --medium /path/to/xp.vmdk
    >
    > 這裡面storagectl 的值是前面創建的磁盤控制器的名字, 這幾個參數都是必須的...最後面的medium 是磁盤的文件名, 這裡要使用絕對路徑...
    >
    > 添加一個光驅, 使用命令:
    >
    >     VBoxManage storageattach xp --storagectl "IDE Controller" --port 1 --device 0 --type dvddrive --medium emptydrive
    >
    > 這裡其實和前面添加硬盤差不了多少, 不過這裡要注意修改port 屬性的值, 另外, 磁盤控制器貌似默認只支持2 個port, 如果需要添加更多的磁盤, 那麼就需要修改磁盤控制器的PortCount 參數.
    >
    > 如果想給光驅插入iso 鏡像, 也可以使用上面的這個命令, 只是把emptydrive 替換成相應的iso 鏡像的路徑即可, 例如:
    >
    >     VBoxManage storageattach xp --storagectl "IDE Controller" --port 1 --device 0 --type dvddrive --medium /path/to/xp.iso
    >
    > 或許有其他方法可以直接往光驅裡面加載iso 鏡像, 不過暫時還沒有發現應該使用哪個命令...

其實如果了解virtualbox 虛擬機的xml 配置文件的定義, 也是可以直接修改對應的vbox 文件的, 對一些比較簡單的配置, 這種方式其實還更快捷一點...比如修改虛擬機的內存配置, 可以直接找到vbox 配置文件中的

     <Memory RAMSize="128" PageFusion="false"/>

將其中的RAMSize 屬性改成自己想要的內存大小...

VBoxManage 還有好多命令, 可以參考[VBoxManage Manual](https://www.virtualbox.org/manual/ch08.html)...