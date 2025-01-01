---
title: "zsh のプラグインマネージャ"
date: 2015-11-24T14:21:43+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/11/24/142143"
tags:
- zsh
- zplug
---

[antigen](https://github.com/zsh-usrs/antigen) ですよね、やっぱり。最近は antigen の軽量バージョンである [zgen](https://github.com/tarjoilija/zgen) もアツいようです。

僕も同様に、最初は antigen 使っていたんですが、まずプラグインの読み込みが遅い（tmux でペインを頻繁に開いたりする身からするとローディングが遅いのはツライ）のと、antigen 自体の機能が貧弱で困ってました。例えば、antigen はプラグインしか管理してくれませんよね。コマンドも管理しようとすると一工夫するしかありません（例: [b4b4r07/http_code](https://github.com/b4b4r07/http_code)）。それに、fzf や jq など CLI ツールとしては有用でもコンパイルする必要があるものの管理は不可能でした。

## zplug

すべての要望に応えるプラグインマネージャをスクラッチから作っています。

- [b4b4r07/zplug](https://github.com/b4b4r07/zplug)

	[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/zplug/demo.gif)](https://github.com/b4b4r07/zplug)
	
	- **並列インストール**（擬似マルチスレッド）
	- **ブランチ/タグ指定**
	- **コマンド管理**（言語は問わない）
	- **バイナリ管理**（GitHub Releases 限定）
	- **ビルド機能**（インストール時に任意のコマンドを実行）
	- **限定インストール**（条件が真のときのみインストール）
	- **依存関係の管理**

まだまだアルファ版でトータルの完成度でいうと antigen には及ばないのでこれからです。
年内のリリース（あわよくば Advent Calender でリリースしたい）を目指して開発中です。

設定は以下のような感じで書けるようにしています。

```sh
source ~/.zplug/zplug

# Make sure you use double quotes
zplug "zsh-users/zsh-syntax-highlighting"
zplug "zsh-users/zsh-substring-search"

# shell commands
zplug "holman/spark", as:cmd
# shell commands (specify export directory path using `of` specifier)
zplug "b4b4r07/http_code", as:cmd, of:bin
# shell commands (whatever language is OK; e.g., perl script)
zplug "k4rthik/git-cal", as:cmd

# binaries (from GitHub Releases)
zplug "junegunn/fzf-bin", \
    as:cmd, \
    from:gh-r, \
    file:fzf
    
# run command after installed
zplug "peco/peco", \
    as:cmd, \
    from:gh-r, \
    of:"peco*/peco", \
    do:"echo Peco"
    
# branch/tag
zplug "b4b4r07/enhancd", at:v1

# true or false
zplug "hchbaw/opp.zsh", if:"[ ${ZSH_VERSION%%.*} -lt 5 ]"

# Group dependencies, emoji-cli depends on jq
zplug "stedolan/jq", \
    as:bin, \
    file:jq, \
    from:gh-r \
    | zplug "b4b4r07/emoji-cli"

# source plugins and add commands to $PATH
zplug load
```

まだ設計・仕様が固まっていないため PR 頂いても応えられないかもしれませんが、issue による意見や star で応援してくださるとやる気が出ます。

- [b4b4r07/zplug](https://github.com/b4b4r07/zplug)
