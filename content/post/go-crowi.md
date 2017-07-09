+++
title = "Crowi 用の API Client 書いて公式に取り込まれた"
date = "2017-04-04T00:00:00+09:00"
description = ""
categories = []
draft = false
author = "b4b4r07"
tags = ["crowi", "go"]
+++

Crowi というオープンソースソフトウェアの wiki があります。


<iframe
  class="c-hatena-embed"
  src="https://hatenablog-parts.com/embed?url=http://site.crowi.wiki/"
  frameborder="0"
  scrolling="no">
</iframe>


Markdown で書ける wiki で、

- Markdown をオートプレビュー
- URL (パス構造) でページを作成/表現できる
- リビジョンヒストリ (差分を管理してくれる)
- いいね、ブックマーク、ポータル機能、...

などの特徴があって、とても便利なサービスです。

簡単に `Heroku to deploy` できるので気になる方は試してみてください。開発者向けにはオールインワンの Docker が有志によってメンテされているので、そちらを試してみても良いかもしれません。

## go-crowi

Crowi 用の API Client を Go で書きました。


<https://github.com/crowi/go-crowi>


Go で API Client は初めて書いたのですが、@deeeet さんの記事が参考になりました。


[GolangでAPI Clientを実装する | SOTA](http://deeeet.com/writing/2016/11/01/go-api-client/)


もともと、Qiita:Team からの移行ツールを Go で書いていたのですが、Crowi API と通信する部分は外部パッケージとして切り出したほうが汎用的に良いなと、go-crowi を作りました。

<https://github.com/b4b4r07/qiita2crowi>

このツールは Qiita:Team からのエクスポート用の JSON を食わすと、指定した Crowi に記事を作成してくれるものです。Qiita から画像を取ってきてアッタチメントしたり、コメントなども移行してくれます。

## Transfer to Crowi

そして今日、Crowi のメインメンテナの @sotarok さんから公式においても良いかも、というお話をいただき transfer しました。

<blockquote class="twitter-tweet" data-lang="ja"><p lang="en" dir="ltr">welcome to official go client for Crowi / “GitHub - crowi/go-crowi: A Go client for Crowi APIs” <a href="https://t.co/mwAGQ12c8w">https://t.co/mwAGQ12c8w</a></p>&mdash; Sotaro KARASAWA© (@sotarok) <a href="https://twitter.com/sotarok/status/848886736591568897">2017年4月3日</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

公式 SDK としたほうが多くの人に使ってもらえるし、ユーザに安心感も与えられるのでこの移譲には大賛成です。P-R も歓迎しています (おそらく自分がこのままメンテすることになると思います)。

現在は 3 つの API に対応しています。

- `/_api/pages.create`
- `/_api/pages.update`
- `/_api/attachments.add`

ここらへんは Crowi API の変更にともなって変更、または追従して新たに追加する予定です。

## Others...

<https://github.com/b4b4r07/vim-crowi>

Crowi 用の Vim plugin も作っているので良かったら見てみてください。開いているファイルでそのままページを作ってくれます。投げたらそのままブラウザを開いてくれるのでとても便利です。[mattn/memo](https://github.com/mattn/memo) と組み合わせると、メモった内容ですぐにページを作れるので捗ると思います。
