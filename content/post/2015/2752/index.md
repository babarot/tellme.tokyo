---
title: "今年つくったものリスト 2015"
date: "2015-12-31T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

{{< img src="20151231005245.png" width="600" >}}

今年はたくさんのプロダクト・ツール・プラグインなどを作った。すべてを GitHub に公開し、git コマンドの操作体系や GitHub などのソーシャルコーディングについても少し詳しくなれた気がする。SNS ライクにやり取りできる GitHub はとても楽しい。

GitHub Advanced search で検索してみた結果、

{{< img src="20151229211217.png" width="300" >}}

総リポジトリ数が90なので、今年つくったものだけで全体の89%にあたる。ゆえに今年は結構活動した年だったといえるようだ。この結果は Twitter のツイートのアナライジングからも見て取れる。

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr">2015年に<a href="https://twitter.com/b4b4r07">@b4b4r07</a>がよく使った言葉は? <a href="https://twitter.com/hashtag/%E3%81%BE%E3%81%A8%E3%82%812015?src=hash">#まとめ2015</a> <a href="https://t.co/NEwUKvjQmY">https://t.co/NEwUKvjQmY</a> <a href="https://t.co/aOaIWqaNY3">pic.twitter.com/aOaIWqaNY3</a></p>&mdash; ババロットさん (@b4b4r07) <a href="https://twitter.com/b4b4r07/status/677389940095713280">2015, 12月 17</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<https://twitter.com/b4b4r07/status/677389940095713280>

たくさんリポジトリを構えてものづくりに取り組んだ2015年であったが、今回はそんな中でも個人的に有用または多くのスターを獲得できたリポジトリを中心に振り返っていこうかと思う。

## [zplug](https://github.com/b4b4r07/zplug)

zplug はおそらく 2015 年で最も注力したプロダクトだ。「zsh 用のプラグインマネージャを作りたい」といった野望や、「自分が作るならこんな設計にしたい」といった構想などは結構前からあったのだけど、実際につくりはじめたのは11月末からだった。1ヶ月をしないで100スターを獲得し、自分の中ではとてもお気に入りである。

zplug の生い立ちは少し特殊で既存の zsh プラグインマネージャ（Antigen や zgen など）の影響はほとんど受けず、Vim のプラグインマネージャを参考に設計された。そのためか neobundle.vim の作者（Shougo さん）や vim-plug の作者（junegunn さん）からスターやコメントをもらえたり、嬉しかった思い出がある。

詳しくは以下のエントリで。

- [おい、Antigen もいいけど zplug 使えよ](http://qiita.com/b4b4r07/items/cd326cd31e01955b788b)
- [zplug カテゴリーの記事一覧 - tellme.tokyo](http://blog.b4b4r07.com/archive/category/zplug)

## [enhancd](https://github.com/b4b4r07/enhancd) v2

`cd` コマンドの拡張を書いた。zsh では cdr という標準機能があり、peco や fzf  と組み合わせる術が流行ったように思う。個人的にこの類の他のツールや cdr は合わなかった or 細部が気に食わなかったのでシェルプラグインとして新たに作り直した。カスタマイザブルなのがいいところで fzf や peco など自分が使いたいフィルタを選べるようになっている。また、初めて200スターを超えた作品となった。

- [ターミナルのディレクトリ移動を高速化する](http://qiita.com/b4b4r07/items/2cf90da00a4c2c7b7e60)
- [やったー！GitHub にスターが 200★ 付いた](http://blog.b4b4r07.com/entry/2015/11/12/170536)

## [emoji-cli](https://github.com/b4b4r07/emoji-cli)

コマンドラインで emoji を扱いやすくするための zsh プラグイン。補完を fzf などのフィルタツールで模擬的に実装している。コマンドラインから絵文字入りのコミットメッセージなどを補完するのに便利で、編集距離を計算してあいまい検索ができる。

- [コマンドラインで emoji を扱う](http://qiita.com/b4b4r07/items/1811f39a5f1418b38ec4)

## [http_code](https://github.com/b4b4r07/http_code)

HTTP のステータスコードをコマンドラインから検索するためのツール

- [HTTP のステータスコードを簡単に調べる](http://blog.b4b4r07.com/entry/2015/11/07/165928)

## [ssh-keyreg](https://github.com/b4b4r07/ssh-keyreg)

ssh キーをコマンドラインから作成するのは `ssh-keygen` でできるが、GitHub に公開鍵を登録するのは意外と面倒だったりする。そんなとき[関連したエントリ](http://qiita.com/ABCanG1015/items/639c1e081f2a04a17f7d)を発見し、PR などを送っているうちに新しいツールとして切り出したのがこれ。

- [ほんの 1分で GitHub に公開鍵を登録して SSH 接続する](http://blog.b4b4r07.com/entry/2015/11/11/230138)

## [zsh-gomi](https://github.com/b4b4r07/zsh-gomi)

zsh 用のコマンドで（zsh さえインストールされていれば bash でも動くが）[gomi](https://github.com/b4b4r07/gomi) を再発明したもの。[gomi](https://github.com/b4b4r07/gomi) は Go 言語で実装されており、簡単な fzf/peco ライクなインタラクティブフィルタを内蔵しているが、そのクォリティが低いためシェルスクリプトで fzf を利用する形で作りなおしたもの。名前からも分かる通り、コマンドラインからゴミ箱を利用するコマンドになっていて OSX で利用する場合、システムのゴミ箱とも連携できるのが強み。

## その他

[user:b4b4r07 created:>2015-01-01](https://github.com/search?l=&o=desc&q=user%3Ab4b4r07++created%3A%3E2015-01-01&ref=advsearch&s=stars&type=Repositories&utf8=✓)

# 最後に

実を言うと id:rhysd さんの[エントリ](http://rhysd.hatenablog.com/entry/2013/12/31/191302) に触発されてつくったもののまとめ記事を書いた。[草を生やす技術](https://speakerdeck.com/rhysd/cao-wosheng-yasuji-shu-number-mydev)を含め、個人的に参考になるエントリが多い。

（やばい…やばいぞ。書いていて思ったが、2015年は紹介できるような Vim プラグインを作っていないじゃないか…。来年は Vim プラグインをもっと作りたい。）

{{< img src="20151229224824.png" width="200" >}}
