---
title: "zplug を使った zsh プラグイン管理術"
date: 2015-12-13T17:42:09+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/12/13/174209"
tags:
- zsh
- zplug
---

zplug とは zsh のプラグインマネージャ。

https://github.com/b4b4r07/zplug

- 何でも管理できる（コマンド、Gist、oh-my-zsh のプラグイン、GitHub Releases のバイナリ）
- 非同期インストール/アップデート
- ブランチロック・リビジョンロック
- インストール後の コマンド実行 hook あり
- oh-my-zsh などの外部プラグインをサポート
- バイナリを管理できる（GitHub Releases）
- shallow clone できる（オン・オフ）
- 依存関係の記述ができる
- ユーザはプラグインマネージャのことを考えなくていい（`*.plugin.zsh` 不必要）
- 選択的インターフェイスとの連携（fzf, peco, percol, zaw）

# 書き方

zplug はタグという概念を持っている。タグとはプラグインの属性情報を表したもので、`タグ:値` のセットで記述していく。

```bash
zplug "foo/bar", as:command, of:"*.sh"
```

こんな具合である。各タグ間はカンマと一つ以上のスペース（`,　`）で区切る必要がある。タグの値は必ずしもクォートで括る必要はないが、ワイルドカードなどファイルグロブを値と指定する場合、シェルに展開されないようにクォーティングする。

## タグ一覧

現在利用できるタグは以下のとおり。

| タグ | 説明 | 値 (デフォルト値) | 例 |
|-----------|-------------|-----------------|---------|
| `as`      | コマンドかプラグインかを指定する | `plugin`,`command` (`plugin`) | `as:command` |
| `of`      | `source` するファイルへの相対パスかパスを通すコマンドへの相対パスを指定する（glob パターンでも可） | - (`"*.zsh"`) | `of:bin`,`of:"*.sh"` |
| `from`    | 外部からの取得を行う | `gh-r`,`gist`,`oh-my-zsh`,`github`,`bitbucket` (`github`) | `from:gh-r` |
| `at`      | ブランチ/タグを指定したインストールをサポートする | ブランチかタグの名前 (`master`) | `at:v1.5.6` |
| `file`    | リネームしたい名前（コマンド時に有用） | 好きなファイル名 (-) | `file:fzf` |
| `dir`     | インストール先のディレクトリパス | (設定不可,read only) | - 
| `if`      | 真のときダウンロードしたコマンド/プラグインを有効化する | 真か偽 (-) | `if:"[ -d ~/.zsh ]"` |
| `do`      | インストール後に実行するコマンド | コマンド (-) | `do:make install` |
| `frozen`  | 直接指定しないかぎりアップデートを禁止する | 0か1 (0) | `frozen:1` |
| `commit`  | コミットを指定してインストールする (`$ZPLUG_SHALLOW` が真かどうかに関わらず) | コミットのハッシュ値 (-) | `commit:4428d48` |
| `on`      | 依存関係 | (設定不可,read only) | - |
| `nice`    | 優先度（高 -20 〜 19 低）の設定をする。優先度の高いものから読み込む。10 以上を設定すると compinit のあとにロードされる | -20..19 (0) | `nice:10` |

具体的な書き方については [README](https://github.com/b4b4r07/zplug) か [公式の Wiki](https://github.com/b4b4r07/zplug/wiki/zshrc) を参照。

## タグの省略について

タグは限りなく怠惰な指定が可能である。例えば、

```bash
zplug "zsh-users/zsh-history-substring-search"
```

は

```bash
zplug "zsh-users/zsh-history-substring-search", as:plugin, from:github, of:"*.zsh"
```

と等価である。意味はそのままで、「プラグインとして解釈され（as）、GitHubから取得し（from）、`*.zsh` なファイル（of）を読み込む」ことを指定している。

つまりタグは省略された場合、デフォルト値が適用される。他にも `at:master, nice:0` が適用されているが、zplug のタグにおいてとても重要なのは `as`, `of`, `from` である。逆にこの 3 つを使えばだいたいのコマンドやプラグインを管理下に置くことができるように思う。

# 各コマンド

また、タグによって指定されたプラグイン属性は各種サブコマンドによってインストールされたりロードされたりする。

ここで zplug コマンドの役割とフローを説明する。

1. 「ユーザ名/リポジトリ名」を引数に `zplug "foo/bar"` としてプラグインを連想配列 `$zplugs` に登録する（このとき、プラグイン名がキーで、タグによる属性情報が値となる）
2. `zplug install` でインストールする
3. `zplug load` で `source` されたりコマンドならシンボリックリンクが作成される
4. プラグイン・コマンドが使用可能になる

## インストールとアップデート

`zplug install` と `zplug update` によりインストールとアップデートが行える。インストールする項目があるか、アップデートする項目があるか、はそれぞれ `zplug check` と `zplug status` によって確認できる。

また、zplug check は（例えるなら）Boolean な関数なので以下の様な書き方ができる。

```bash
zplug check || zplug install
```

また、インストール済みかどうかのチェックで設定項目を書くのにも使用されるべきである。

```bash
if zplug check "zsh-users/zsh-history-substring-search"; then
    bindkey '^P' history-substring-search-up
    bindkey '^N' history-substring-search-down
fi
```

これでインストールされていないときに、不要なキーバインドの設定を防ぐことができる。
