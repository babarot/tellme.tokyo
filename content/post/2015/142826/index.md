---
title: "拡張版 cd コマンドの enhancd が生まれ変わった"
date: "2015-07-21T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/logo.gif)](https://github.com/b4b4r07/enhancd)

- [b4b4r07/enhancd ❤ GitHub](https://github.com/b4b4r07/enhancd)

以前、シェルスクリプトの勉強の集大成として enhancd というプラグインちっくなものを書いた。これは `cd` コマンドのラッパー関数を提供するもので、通常のビルドインにはないメリットがたくさんある。`cd` コマンドはよく使われるコマンドの一つにも関わらず、その使い勝手はあまり良くない。たとえば、フルパスもしくは相対パスで辿れるディレクトリにしか移動できない。当たり前ではあるけど、すべてのパスを覚えているわけではないし、間違ったパスや単にディレクトリ名だけを与えても、よしなにやってくれるコマンドが欲しかったのだ（grep だって使いやすさを向上させた `ack`, `ag`, `pt` といったコマンドがある）。

次に「どの言語で実装するか」、になるのだが（シェルスクリプトの勉強というのはさておき）、シェルスクリプトでなければならない理由というのがあって、それはディレクトリ移動に関する拡張を実装するからだ。ディレクトリ移動は基本的にカレントシェルである必要がある。ユーザがログインしてインタラクティブに実行しているシェル上で移動しなければ、もちろんのことながら見た目上、移動しない。
よくある（悪い）例が、

```console
$ cat cd.sh
#!/bin/bash
cd ~/src
pwd
$ ./cd.sh
/home/lisa/src
$ pwd
/home/lisa
```

シェルスクリプトで `cd` を実行し `pwd` した後、コマンドラインから `pwd` してもパスが変わっていないというやつだ。これはシェルスクリプトを実行するとき、別のプロセスの bash 上で `cd` が実行されているんだけど、シェルスクリプトが終了するとそのプロセスも終了するから見た目上 `cd` してないように感じる。これを回避するにはカレントシェルで実行するほかないのだ。

シェルには `source` というコマンドがあって、これは誤解があるようにいえばカレントシェルでスクリプトを実行することを意味する。これを使うことで先ほどの構想は実現できる。別言語で書いても無理やりカレントシェルに反映させる方法もある（`exec $SHELL`）が、これは結構雑な方法でバックグランプロセスとかも消し去ってしまうので避けたかったということもある。

# なぜ生まれ変わったか

先代の enhancd（v1.0）は約 600 行だったが、シェルスクリプトの 600 行は結構メンテナンスが大変。シェルスクリプトの性質上、可読性も悪い上に、行指向な記述が多くなるためさらにそれに拍車をかけた。カスタマイザブルにしたかったため、たくさんの環境変数で操作できるような UI にしてたことと、途中から Zsh でも動作するように書き換えていったため、非常に煩雑になっていた。既知のバグもあったが、それらが影響してなかなかに取りづらく機能も拡張しづらくまさにスパゲッティ状態だった。エブリデイで使っているくせにこんな汚いものを使いたくないと、[cdinterface](https://github.com/b4b4r07/cdinterface) という別プロジェクトで簡素化したプラグインを立ち上げた。個人的にこれで満足していた。
が、しかし。
最近になり enhancd にやたらスターがつくようになり（といっても記事執筆時 8 stars）見られていると思うとなんだか恥ずかしくなったので久しぶりにメンテナンスを…と思い立ったのだがやはり厳しいものがあった。時間も無駄になりそうだし更にスターが付いちゃう前にメジャーバージョンアップという名の下 cdinterface と統合しようとなった。

# 新しい enhancd

その前に cdinterface とは、絞りこみ部分をビジュアルフィルタ（`peco` や `fzf`）に任せると割り切って
作った cd 拡張。enhancd v1.x では自前実装をしていて、フィルタリングツールではなく補完部分がこれを担っていた。そのため結構複雑怪奇になっていたという問題点を解消した。そもそも enhancd のような高級 cd コマンドを使う場合、CLI インフラ（プラグインや依存ツールなど）は整っているはず。なので外部コマンドに依存しても問題ないと判断。

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/demo.gif)](https://github.com/b4b4r07/enhancd)

移動するたびに履歴だけをログとしてテキストファイルに記録して、曖昧なパスを渡されたときにだけログを検索し、ヒット件数が2件以上ある場合にその絞り込みをフィルタリングツールでふるうようにしてある。

また、標準入力を受け付けるようにしているので、

```console
$ echo ~/src | cd
```

ということもできるようにしてある。

フィルタリングに使うツールの指定は環境変数からできる。ENHANCD_FILTER という環境変数に使いたいビジュアルフィルタを登録する。`$PATH` のようにコロン区切りで複数指定でき、利用可能な最初のほうにあるコマンドをフィルタリングツールとして使用する。空の場合や利用できるフィルタがない場合は enhancd は利用できない（~~通常の cd として振る舞う~~ 今のところ ENHANCD_FILETER not set となってエラーにしてる）。

```console
$ ENHANCD_FILTER=unko:fzf:gof:peco:hf; export ENHANCD_FILTER
$ cd
  ...
  /Users/b4b4r07/src/github.com/b4b4r07/enhancd/zsh
  /Users/b4b4r07/src/github.com/b4b4r07/gotcha
  /Users/b4b4r07/src/github.com/b4b4r07/blog/public
  /Users/b4b4r07/src/github.com/b4b4r07
  /Users/b4b4r07/Dropbox/etc/dotfiles
  /Users/b4b4r07/src/github.com/b4b4r07/enhancd
> /Users/b4b4r07
  247/247
> _
```

## インストール

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/installation.png)](https://github.com/b4b4r07/enhancd)

ここまで読んでくれたなら興味があるんじゃなかろうか。インストールは簡単に出来て、

```console
$ curl -L git.io/enhancd | sh
```

これをターミナルでコピペするだけ。やっていることはクローンしてきて、`source` するようにサジェストするだけだが、セキュリティが...という人は、

```console
$ git clone https://github.com/b4b4r07/enhancd ~/.enhancd
$ echo "source ~/.enhancd/enhancd.sh" >> ~/.bashrc
```

とすればいい。

Zsh ユーザで antigen を利用しているなら、

```bash
antigen bundle b4b4r07/enhancd
```

と .zshrc に追記するだけ。

ちなみに、enhancd は Bash, Zsh, Fish で動作する。
