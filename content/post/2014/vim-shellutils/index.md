---
title: "Vim からシェルコマンドを実行するプラグインを作った"
date: "2014-10-05T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

{{< hatena "https://github.com/b4b4r07/vim-shellutils" >}}

{{< img src="demo.gif" width="700" >}}

Vim の魅力の1つにシェルとの親和性が挙げられます。
GUIじゃない Vim を使っている時にどうしてもさっと `ls` したかったり、さっとファイルの中身を `cat` してみたかったりしたときに、Vim を終了したくない、なんてことはありませんか。
`Ctrl-z` で Vim を中断し、コマンドをタイプし処理して戻ってきた頃には、「あれ、、、なんだったっけ」なんてこともしばしば。
思いつきやアイデアは1分1秒が大事なのです。

そこで Vim のコマンドライン領域からシェルコマンドもどきを実行できるプラグインを作成しました。
もどきと書いたのは `call system()` や `!command` の類を使用しないためです（シェルコマンドをエミュレート）。
どちらもシェルのコマンドに依存する上に一時的に Vim 画面が切り替わったり、あまり挙動が好みではありませんでした。
そこで純 Vim script で作成することで Vim さえあればシェルコマンドを実行出来るようにしました。

詳しくは、

- [README.md](https://github.com/b4b4r07/vim-shellutils/blob/master/README.md)
- [doc/shellutils.txt](https://github.com/b4b4r07/vim-shellutils/blob/master/doc/shellutils.txt)

をご覧ください。
