---
title: "ほんの 1分で GitHub に公開鍵を登録して SSH 接続する"
date: 2015-11-11T23:01:38+09:00
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/11/11/230138"
tags:
- bash
- zsh
- shellscript
---

[repo]: https://github.com/b4b4r07/ssh-keyreg

公開鍵認証はとても便利ですが、他のマシンに移ったり Vagrant などで仮想開発環境をつくったときなど GitHub に公開鍵をアップロードするの面倒ではないですか？

`ssh-keygen` で作成された `公開鍵.pub` の中身をコピーしてブラウザに貼り付けて `ssh -T git@github.com` できるかチェック．．．

面倒なので簡略化したプラグインをつくりました。利用者が打ち込むコマンドは以下のみです。

```console
$ # (antigen bundle b4b4r07/ssh-keyreg)
$ ssh-keygen
$ ssh-keyreg
```

はやい！！！

[![DEMO](https://raw.githubusercontent.com/b4b4r07/screenshots/master/ssh-keyreg/demo.gif)][repo]

- [b4b4r07/ssh-keyreg - GitHub][repo]

上では、[antigen](https://github.com/zsh-users/antigen) でインストールすると書いていますが、このプラグインは bash でも動きます（補完は zsh のみです。ごめんなさい）。

## インストール

```console
$ # for zsh
$ antigen bundle b4b4r07/ssh-keyreg

$ # for bash
$ sudo sh -c "curl https://raw.githubusercontent.com/b4b4r07/ssh-keyreg/master/bin/ssh-keyreg -o /usr/local/bin/ssh-keyreg && chmod +x /usr/local/bin/ssh-keyreg"
```

## 使い方

```console
$ ssh-keyreg
usage: ssh-keyreg [-h|--help][[-d|--desc <desc>][-u|--user <user[:pass]>][-p|--path <path>]] [github|bitbucket]
    command line method or programmatically add ssh key to github.com user account

options:
    -h, --help   show this help message and exit
    -d, --desc   description of registration
    -u, --user   username and password (user:pass)
    -p, --path   path of public key
```

単に `ssh-keyreg` とされたときは `~/.ssh/id_rsa.pub` (`--path` オプション) を GitHub (第1引数) の `git の user.name` (`--user` オプション) に `登録した日付` (`--desc` オプション) の名前で登録します。

変更したい場合は、適宜オプションで与えてやれば OK です。

## まとめ

実は、[このエントリ](http://qiita.com/ABCanG1015/items/639c1e081f2a04a17f7d)の fork 版です。最初は pullreq してたのですが、結構書き換えちゃいそうだったので新しく作りました。

小さいながら便利なプラグインです。フィードバック・PR は[こちら](https://github.com/b4b4r07/ssh-keyreg)まで。

参考

- [command line method or programmatically add ssh key to github.com user account - UNIX & LINUX](http://unix.stackexchange.com/questions/136894/command-line-method-or-programmatically-add-ssh-key-to-github-com-user-account)
