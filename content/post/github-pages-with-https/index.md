---
title: "GitHub Pages で HTTPS を有効にする"
date: "2020-01-20T19:58:54+09:00"
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags: ["github-pages", "blog"]
---

GitHub Pages で静的ページを公開するのが簡単なのでよく使う。
これまで公開したサイトの HTTPS 化は Cloudfrare でやっていた。[^1]
めんどくさくて移行していなかったんだけど HTTPS 化するのも GitHub Pages の設定画面からできるようなのでやっていく[^2]。

## 1. IP をレジストラに追加する

[公式ガイドにある通り](https://help.github.com/en/github/working-with-github-pages/managing-a-custom-domain-for-your-github-pages-site#configuring-a-records-with-your-dns-provider)、GitHub の A レコードをすべて登録する。

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

{{< img src="ip.png" width="400" >}}

待っていると数分でつながるようになる。

```bash
$ dig babarot.me +nostats +nocomments +nocmd

; <<>> DiG 9.10.6 <<>> babarot.me +nostats +nocomments +nocmd
;; global options: +cmd
;babarot.me.                    IN      A
babarot.me.             3185    IN      A       185.199.110.153
babarot.me.             3185    IN      A       185.199.108.153
babarot.me.             3185    IN      A       185.199.111.153
babarot.me.             3185    IN      A       185.199.109.153
```

## 2. 該当リポジトリで設定

{{< img src="settings.png" width="600" >}}

1. Custom domain に使用する独自ドメインを書く (CNAME ファイルがコミットされる)
2. 少し待ってると Enforce HTTPS のチェックボックスが押せるようになる
3. 少し待ってるとブラウザなどから https で接続できるようになる

ここまで正味15分くらい、待ち時間を入れても30分くらいでできた。

## 参考

- [GitHub Pages の独自ドメインを HTTPS 化した - Hitori-Gotten Log](https://sfus.net/blog/2018/11/migrate-to-https/)
- [GitHub hosting の custom domain が HTTPS 対応したので HTTPS 化してみた - ばうあーろぐ](https://girigiribauer.com/archives/20180503/)
- [GitHub Pagesを独自ドメインで運用する - taikii blog](https://taikii.net/posts/2018/07/github-pages-with-custom-domain/)
- [GitHub Pagesの独自ドメインHTTPS化対応 - Qiita](https://qiita.com/shiruco/items/b504365371f18bfae7c8)
- [GitHub Pagesで公開しているサイトを独自ドメインでHTTPS化する方法 | risacan.github.io](https://risacan.net/GitHub-Pages%E3%81%A7%E5%85%AC%E9%96%8B%E3%81%97%E3%81%A6%E3%81%84%E3%82%8B%E3%82%B5%E3%82%A4%E3%83%88%E3%82%92%E7%8B%AC%E8%87%AA%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E3%81%A7HTTPS%E5%8C%96%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95/)

[^1]: [GitHub Pages + CloudFlare で独自ドメインをSSL化する - Qiita](https://qiita.com/noraworld/items/89dd85a434a7b759e00c)
[^2]: [HTTPS で GitHub Pages サイトを保護する - GitHub ヘルプ](https://help.github.com/ja/github/working-with-github-pages/securing-your-github-pages-site-with-https)
