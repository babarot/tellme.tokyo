---
title: "ターミナルのディレクトリ移動を高速化するプラグイン「enhancd」のその後"
date: 2015-08-12T18:35:23+09:00
draft: true
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/08/12/183523"
tags:
- bash
- zsh
- shellscript
---

事の発端はこのツイート（であろう）。

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">“ShellScript - ターミナルのディレクトリ移動を高速化する - Qiita” <a href="http://t.co/Q3AUMcNwnN">http://t.co/Q3AUMcNwnN</a></p>&mdash; mattn (@mattn_jp) <a href="https://twitter.com/mattn_jp/status/629606937139679232">2015, 8月 7</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

そうしたらバズり始めた。

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr"><a href="https://twitter.com/hashtag/bookmark?src=hash">#bookmark</a> ShellScript - ターミナルのディレクトリ移動を高速化する - Qiita <a href="http://t.co/SNZ4gRTo1N">http://t.co/SNZ4gRTo1N</a> 良さがある。試そう。</p>&mdash; OGATA Tetsuji (@xtetsuji_) <a href="https://twitter.com/xtetsuji_/status/629834467046215680">2015, 8月 8</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">これは使いたい&#10;ShellScript - ターミナルのディレクトリ移動を高速化する by <a href="https://twitter.com/b4b4r07">@b4b4r07</a> on <a href="https://twitter.com/Qiita">@Qiita</a> <a href="http://t.co/V593HCtuH0">http://t.co/V593HCtuH0</a></p>&mdash; あきこ (@Akiko_4628) <a href="https://twitter.com/Akiko_4628/status/629837248733679616">2015, 8月 8</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">つこてみよう &quot;ShellScript - ターミナルのディレクトリ移動を高速化する - Qiita&quot; - <a href="http://t.co/cwMwCEktfX">http://t.co/cwMwCEktfX</a></p>&mdash; フェリス・シルヴェストリス・カトゥス (@anekos) <a href="https://twitter.com/anekos/status/629870311949754368">2015, 8月 8</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">よさげ / ShellScript - ターミナルのディレクトリ移動を高速化する - Qiita <a href="http://t.co/0hjpHGTMnU">http://t.co/0hjpHGTMnU</a></p>&mdash; ぺっく (@peccul) <a href="https://twitter.com/peccul/status/629951168785985536">2015, 8月 8</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">これいいね…｜ShellScript - ターミナルのディレクトリ移動を高速化する by <a href="https://twitter.com/b4b4r07">@b4b4r07</a> on <a href="https://twitter.com/Qiita">@Qiita</a> <a href="http://t.co/WHotb2sM4F">http://t.co/WHotb2sM4F</a></p>&mdash; kazken3_(:3」∠)_ (@kazken3) <a href="https://twitter.com/kazken3/status/630235488192847872">2015, 8月 9</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">ShellScript - ターミナルのディレクトリ移動を高速化する by <a href="https://twitter.com/b4b4r07">@b4b4r07</a> on <a href="https://twitter.com/Qiita">@Qiita</a> <a href="http://t.co/kU9bDKZgSC">http://t.co/kU9bDKZgSC</a>&#10;良さそう</p>&mdash; eau (@mint_0_rook) <a href="https://twitter.com/mint_0_rook/status/631326132105646081">2015, 8月 12</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">これはすごい／ShellScript - ターミナルのディレクトリ移動を高速化する by <a href="https://twitter.com/b4b4r07">@b4b4r07</a> on <a href="https://twitter.com/Qiita">@Qiita</a> <a href="http://t.co/syTH4VT9eG">http://t.co/syTH4VT9eG</a></p>&mdash; わ (@mwktk2) <a href="https://twitter.com/mwktk2/status/631378345691746305">2015, 8月 12</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">ちょっとこれステキすぎる気配がする。使ってみよう。&#10;ShellScript - ターミナルのディレクトリ移動を高速化する - Qiita&#10;<a href="http://t.co/r4qclbsa7Q">http://t.co/r4qclbsa7Q</a></p>&mdash; 睦月@インフラ技術…者？ (@mutsuki99) <a href="https://twitter.com/mutsuki99/status/631341614493929472">2015, 8月 12</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-cards="hidden" lang="ja"><p lang="ja" dir="ltr">おお｜ ShellScript - ターミナルのディレクトリ移動を高速化する - Qiita&#10;<a href="http://t.co/D4MbbygY2W">http://t.co/D4MbbygY2W</a></p>&mdash; カズキック2 (@kzkick2nd) <a href="https://twitter.com/kzkick2nd/status/630721390937640960">2015, 8月 10</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
