---
title: "やったー！GitHub にスターが 200★ 付いた"
date: 2015-11-12T17:05:36+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/11/12/170536"
tags:
- bash
- zsh
- shellscript
---

[repo]: https://github.com/b4b4r07/enhancd

ありがとうございます。素直に嬉しい。GitHub アカウント開設して初めての 3 桁以上（100 超えたときは観測していなかった）のスターを頂いた。

{{< img src="20151112165436.png" width="400" >}}

## つくったもの

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/logo.gif)][repo]

### [b4b4r07/enhancd][repo]

ディレクトリ移動の支援プラグインをつくった。よくあるタイプのプラグインだけど、個人的に以下 2 つの特徴がある。

- [peco](https://github.com/peco/peco), [fzf](https://github.com/junegunn/fzf) を使ったインタラクティブ性
- レーベンシュタイン距離による曖昧検索

インタラクティブフィルタで候補を絞り込める（`peco` を使うか `fzf` を使うかはユーザが選べる）のと、編集距離を計算して誤字脱字を無視してくれるのが好印象だと思ってる。それと、bash/zsh/fish をサポートしているのもよさ。

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/demo.gif)][repo]

使い方とかインストールとか、前に一度記事にしたので興味ある方はどうぞ！

[http://qiita.com/b4b4r07/items/2cf90da00a4c2c7b7e60:embed:cite]

## 評価とか

結構嬉しいコメントが付いたり。もちろん、（載せてないけど）良くないコメントもある。ソフトウェアの受け取り方・印象・使い勝手は人それぞれで違って当たり前なので、そこは問題じゃなくって、使ってくれて**便利**、**いいね**とか思ってくれている人が少しでもいるってことに喜びを感じている。

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">A next-generation cd command with an interactive filter&#10;<a href="https://t.co/XrFBXmlhR8">https://t.co/XrFBXmlhR8</a>&#10;&#10;無駄な機能はないし，直感的だし，awesomeとしか言いようがない</p>&mdash; RED FAT だるま (@red_fat_daruma) <a href="https://twitter.com/red_fat_daruma/status/631963900452343808">2015, 8月 13</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">『A next-generation cd command with an interactive filter』&#10;ネーミングとロゴいいなぁ&#10;&#10;RT b4b4r07/enhancd <a href="https://t.co/0qWmyuGA58">https://t.co/0qWmyuGA58</a></p>&mdash; ζ (@zetamatta) <a href="https://twitter.com/zetamatta/status/633269912383848448">2015, 8月 17</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">enhancdめっちゃべんりなので、peco-cdrいらないかな</p>&mdash; ｽﾀｲﾘｯｼｭﾀﾌｶﾞｲ (@upamune) <a href="https://twitter.com/upamune/status/633290724541251584">2015, 8月 17</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## まとめ

コントリビューターの方、ありがとうございました。

{{< img src="20151112165927.png" width="400" >}}

今後とも宜しくお願いします。

### 関連記事

- [ターミナルのディレクトリ移動を高速化する - Qiita](http://qiita.com/b4b4r07/items/2cf90da00a4c2c7b7e60)
- [拡張版cdコマンドのenhancdが生まれ変わった - tellme.tokyo](http://blog.b4b4r07.com/entry/2015/07/21/142826)
- [ディレクトリ移動系プラグイン「enhancd」の実装 - tellme.tokyo](http://blog.b4b4r07.com/entry/2015/08/16/092849)
