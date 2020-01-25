---
title: "シェルスクリプトで git gc してまわるやつ"
date: 2015-12-26T16:41:41+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/12/26/164141"
tags:
- bash
- go
- shellscript
---

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">GOPATH の git リポジトリを全部 git gc してまわるやつ。要 ghq <a href="https://t.co/c4igqWnWR0">https://t.co/c4igqWnWR0</a></p>&mdash; mattn (@mattn_jp) <a href="https://twitter.com/mattn_jp/status/675225401615122433">2015, 12月 11</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">じゃかじゃかと git gc していってる。 <a href="https://t.co/MPuXHKzkrt">pic.twitter.com/MPuXHKzkrt</a></p>&mdash; mattn (@mattn_jp) <a href="https://twitter.com/mattn_jp/status/675227226506416128">2015, 12月 11</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

ほほう。Go による非同期処理でじゃがじゃが git gc ですか、シェルスクリプトでも非同期でやってみよう。

```sh
#!/bin/bash

find ${GOPATH%%:*}/src/github.com \
    -follow \
    -maxdepth 2 \
    -mindepth 2 \
    -type d | while read repo; do
cd "$repo" && git gc &
done
wait
```

{{< img src="20151215111759" >}}

いい感じやで。

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr"><a href="https://twitter.com/lestrrat">@lestrrat</a> <a href="https://twitter.com/mattn_jp">@mattn_jp</a> 良くよく考えたらたしかにワンライナーでしたな！ ghq list -p | xargs -P 10 -n 1 — bash -c ‘cd $0; git gc;’</p>&mdash; Daisuke Maki (@lestrrat) <a href="https://twitter.com/lestrrat/status/675247164759633922">2015, 12月 11</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

書いたのにこんなのを見つけた。ワンライナーじゃん。

（こっちは ghq に依存していないから…）
