---
title: "dotfiles を curl -L dot.hoge.com | sh でインストールする方法"
date: "2015-01-18T00:39:49+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: "http://b4b4r07.hatenadiary.com/entry/2015/01/18/235212"
tags: ["shell", "dotfiles"]

---

dotfiles をインストールする際に、

```console
$ curl -L https://raw.githubusercontent.com/{YOUR_ACCOUNT}/dotfiles/master/install.sh | bash
```

といった具合にウェブを介してスクリプトを実行することが一般的になりつつあると思いますが、この方法にはひとつ問題がありそれは URL 部分が長いということです。これは結構厄介で長すぎるがゆえに暗記できないので、いちいちブラウザを起動してコピペしないといけなかったり、そもそもブラウザなどないようなどこかのサーバにデプロイするときなど、暗記していたほうがいい場面が結構あります。

>[curl -sL dot.hoge.com | sh で自分専用環境を構築する方法（かっこいい）](http://orgachem.hatenablog.com/entry/2014/05/13/001100)

そんなとき、このエントリを発見しました。
独自ドメインを取得して、そのサブドメインに自分で立ち上げた Nginx で dotfiles リポジトリへリダイレクトしてやるようにする方法です。こうすることで、github の URL 部分を自分のドメインを使った好きな URL にすることができるようになります。

しかし、この方法はサーバと独自ドメインの2つを用意しなければなりません。エンジニアたるものサーバやドメインは持っていたほうがいいのかもしれませんが、持っていなかった場合 dotfiles の URL 短縮のためだけに維持費に数千円／年を支払うのはもったいないですよね。

そこで、利用するのが短縮 URL サービスです。最近ではとても身近なものになり、スタンダードになりつつある [Bitly](https://bitly.com) をはじめ Amazon 専用の amzn.to や Google の goo.gl などとても増えてきています。

その中でも、今回はカスタムドメインを指定できる [Bitly](https://bitly.com) を使用します。これでリダイレクトさせるウェブページを作成する必要がなくなり、サーバ代を浮かすことが出来ます（注：ただし独自ドメインは取得する必要があります）。

## 事前準備

### 独自ドメインの取得

- [ムームードメイン](http://muumuu-domain.com)
- [お名前.com](http://お名前.com)

有名どころですとサクッと取得することができます。
個人情報を入力し、年額を支払い、振込が確認された後、認証まで数時間たつとドメイン取得となります！

{{< img src="1.png" >}}

ここらへんは100円／年台からなのでとても安価です。

### Bitly アカウント作成

無料アカウントを作成します。最近までは Bitly Pro という有料サービスでカスタムドメインの設定を提供していましたが、今では無料アカウントに開放しています。

## カスタムドメインの設定

さて、ここからが本番です。ここからは筆者の環境（ [ムームードメイン](http://muumuu-domain.com)）で説明していきます。 [ムームードメイン](http://muumuu-domain.com)のサイトにいき、

{{< img src="2.png" >}}

「ムームーDNS」＞「変更」と進んでいき、設定2のペインある入力欄に必要事項を書き込みます。

- **名前**に入力したものはサブドメインになります。**dot** とした場合、`dot.hoge.com` とできます。空欄の場合は、`hoge.com` です。
- **レコード**は A を選択します
- **内容**は「69.58.188.49」としてください

あとは「セットアップ情報変更」をクリックでOKです。これらの操作は慎重を期して行うべきため、各所で変更の同意を問うようなダイアログが出ると思いますが確認してOKすればいいです。

{{< img src="3.png" >}}

次は、[Bitly](https://bitly.com) の設定です。

{{< img src="4.png" width="250" >}}

「Setting」＞「Advanced」＞「Branded Short Domain」とすすみ、先ほど取得したサブドメイン `dot.hoge.com` を打ち込み Add します。
そして Verify します。DNS の設定が浸透されるまで、少し待ちます。数秒から数十秒（環境によっては数十分かかる場合も）で反応が帰ってきます。
（注：先に Profile タブでメール設定を Verify する必要があります）

{{< img src="5.png" width="700" >}}

最後の仕上げです。

Branded Short Domain Root Redirect の設定です。これは、カスタムドメインの URL のルートのリダイレクトの設定です。本来、Bitly などの短縮 URL サービスは `my.domain.com/1B0Ozsdfgag` というような URL の場合、スラッシュ以降のランダム文字列を必要をしますが、この設定をするとルート（スラッシュ以前）でリダイレクトさせることが出来ます。つまり、`dot.hoge.com` を github の raw ページにリダイレクトさせることが出来ます。

完成！[dot.b4b4r07.com](https://raw.github.com/b4b4r07/dotfiles/master/etc/install)

参考サイト：

- [bit.lyに独自ドメインを設定してオリジナルの短縮URLを作ってみた](http://yuhnote.com/2012/04/23/bitly-custom-domain/)
- [独自ドメインで短縮URLを運用する](http://cmshikaku.com/feature/?p=1583)
- [bitly 独自ドメインで短縮する](http://blog.tomget.com/?p=680)
