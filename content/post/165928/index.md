---
title: "HTTP のステータスコードを簡単に調べる"
date: 2015-11-07T16:59:28+09:00
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/11/07/165928"
tags:
- shellscript
---

>HTTPステータスコードは、HTTPにおいてWebサーバからのレスポンスの意味を表現する3桁の数字からなるコードで、RFC 2616、RFC 7231等によって定められている。via [HTTPステータスコード - Wikipedia](https://ja.wikipedia.org/wiki/HTTPステータスコード)

403とか404はよく目にもするので覚えていますが、300番台は？500番台は？とかとなると思い出せないことが多いです。いちいちググり直すのも手間。そんなときに、bash なりのシェルにてエイリアスとして登録しているハックを目にしました。

- [Jxck/dotfiles - GitHub](https://github.com/Jxck/dotfiles/blob/51e2a584de551559d716333a53573d1cd32debdd/zsh/http_status.zsh)

このまま参考にさせてもらおう、と思ったのですがすべて登録するのもな、と思いコマンドで用意しました（番号が変わるものでもないので一度登録して変更することになる心配がないためエイリアスもいいと思います）。

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/http_code/demo.gif)](https://github.com/b4b4r07/http_code)

- [b4b4r07/http_code - GitHub](https://github.com/b4b4r07/http_code)

antigen で簡単にインストールできます。

```console
$ antigen bundle b4b4r07/http_code
```

antigen でない場合は、

```console
sudo sh -c "curl https://raw.githubusercontent.com/b4b4r07/http_code/master/bin/http_code -o /usr/local/bin/http_code && chmod +x /usr/local/bin/http_code"
```

しかし、antigen でインストールしたほうが、補完ファイルなども使用できるようになります。

使い方は gif アニメにもある通り、`-a/--all` オプションをつけると一覧表示、引数に数字を渡すとそれに対する説明を返します。
