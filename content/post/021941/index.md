---
title: "Vimでcdしたときにそのディレクトリの中身を自動でリストアップするプラグイン作った"
date: 2014-07-31T02:19:41+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2014/07/31/021941"
tags:
- vim
---

Vim 内で `:cd` したときに、そのディレクトリにあるファイル一覧を取得したくありませんか。`:!ls` でも解決できますが内部的に処理したかったので却下。イメージとしては、シェルなどでいうところの `cd() { builtin cd "$@" && ls -F; }` です。Vim内で明示的に `:cd` したときに自動で `ls` します。もっと他に簡単なやり方があるかもしれませんが、当方としてはこのやり方で満足していますし、plugin 作成してみたかったという背景もあるので。

[b4b4r07/vim-autocdls](https://github.com/b4b4r07/vim-autocdls)
![autocdls.gif](http://cl.ly/image/1t0W0V3W3E2O/autocdls.gif)

# インストール方法

NeoBundleの利用者は以下でいいです。

```
NeoBundle 'b4b4r07/autocdls.vim'
```

とりあえず、パスの通ったディレクトリに配置すればいいです。

# 使い方

`cd` するだけです。すると勝手に `ls` されファイル一覧を取得出来ます。`:cd` だけでなく、`:lcd` や `:chdir` などでもいいです。もちろん、その省略形も可です。また、`:Ls` とすると、カレントディレクトリのファイル一覧が取得できます。引数を省略すればカレントディレクトリですが、与えてやれば存在する引数先のディレクトリ内のファイルを取得します。ここらへんは、シェルの `ls`  と同じです。

`:Ls!` とすると、`ls -A` と同様の働きをします。

# オプション

シェルの `ls` よりすこしリッチになっていて、自動でファイル数も取得します。この機能を切りたい場合は、`g:autocdls_show_filecounter = 0` とすればよいです（デフォルトでは1）。また、カレントディレクトリ情報（`:pwd`）も同時に欲しい場合は、`g:autocdls_show_pwd = 1` としてください。

![show_pwd](http://cl.ly/image/1a0H1q1n0f39/Image%202014-09-24%20at%205.02.23%20%E5%8D%88%E5%BE%8C.png)

以下に設定例を載せておきます。

```vim:.vimrc
" コマンドラインの高さを上げる
let g:autocdls_set_cmdheight = 2
" Ls したときにファイル数をカウントする
let g:autocdls_show_filecounter = 1
" Ls したときに pwd を表示しない
let g:autocdls_show_pwd = 0
" ls と打つと Ls に置換される
let g:autocdls_alter_letter = 1
" 表示方法をスペース区切りから改行にしない
let g:autocdls_newline_disp = 0
```
