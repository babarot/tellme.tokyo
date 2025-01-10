---
title: "最近の zplug の変更について"
date: 2015-12-21T12:27:01+09:00
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/12/21/122701"
tags:
- zsh
- zplug
---

zplug 公開から今日で1ヶ月。いくつかの機能を追加した

## 1. ローカルプラグインを管理できるようになった

先日の issue（[#54](https://github.com/b4b4r07/zplug/issues/54)）によってローカルリポジトリをロード対象とすることが可能になった。neobundle.vim や vim-plug にもあるお馴染みの機能だ。

```sh
zplug "~/.zsh", from:local
```

`from` タグを使って指定する。自分の場合、`~/.zsh` 以下で zsh の設定ファイルを次のように分割しているため、この機能はとても便利に働く。デフォルトでは `"*.zsh"` が読み込み対象になっているので `~/.zsh` 以下の zsh ファイルを簡単に zplug で管理できる

```console
$ tree ~/.zsh
/Users/b4b4r07/.zsh
├── 10_utils.zsh
├── 20_keybinds.zsh
├── 30_aliases.zsh
├── 40_prompt.zsh
├── 50_setopt.zsh
├── 60_export.zsh
├── Completion
│   ├── _ack
│   ├── _add-sshkey-remote
│   ├── _ag
...
│   └── _path
├── Makefile
└── README.md
```

フルパスでない場合は `$ZPLUG_HOME` を基準にパス解決される。

```sh
zplug "repos/user/repo", from:local
```

## 2. 読み込むファイルを一部無視できるようになった

これもまた issue（[#56](https://github.com/b4b4r07/zplug/issues/56)）によって導入された機能で、`of` タグと逆の指定をするためのタグ `ignore` が使用できるようになった。

`of` タグはデフォルトで `*.zsh` を読みに行く（`as:plugin` のとき）が一部ファイルを除外したい、なんてときに有効である。

```sh
zplug "foo/bar", as:plugin, of:"*.zsh", ignore:some_file.zsh
```

`of` と同じくグロブによる指定も可能で、基本的に相対パス指定するがこのときのパス解決の基準は 指定した `foo/bar` ディレクトリである（`from:oh-my-zsh` を除く）。

優先度は `of`<`ignore`なので、

```sh
zplug "b4b4r07/enhancd", of:enhancd.sh, ignore:enhancd.sh
```

とすると、何もされないことになる。

## 3. Wiki を書いた

- [Configurations・b4b4r07/zplug Wiki](https://github.com/b4b4r07/zplug/wiki/Configurations)
