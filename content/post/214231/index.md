---
title: "golang で zsh history を SQL 的に活用する"
date: 2017-02-14T21:42:31+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2017/02/14/214231"
tags:
- go
- sql
---

僕は開発中、zsh のヒストリー補完の機能をよく使います。具体的には次のような場面が多いです。

- 多用するコマンド
  - 結局開発中に使うのはエディタ (vim) と git サブコマンドに集中する
  - ちょちょいと `^N` (`↑`) で履歴をさかのぼる
- alias がイケてない場面
  - 「エディタで `.zshrc` 開いて追加してリロード」が面倒で後回ししがち
    - そして登録せずに終わる
    - の繰り返し...
  - うろ覚え程度のコマンドの alias 名はもはや思い出せない
    - 結局エディタ開いて見直したり、`^R` で遡ることに挑戦する
- 長いコマンド列になるとき
  - 引数が多いとき、多段のパイプで繋いだとき
  - 例えば、複数のパラメータを与えたときの `curl` コマンド

Ctrl-r (`history-incremental-search-backward`) よるヒストリーサーチが便利なのはよく知られたことですが、それに加えて [peco](https://github.com/peco/peco) のようなコマンドラインセレクタと zsh history を組み合わせて、過去に自分が入力したコマンドをその一部の記憶から引き出せるようにしたりして、便利になるようにカスタマイズしていました。

しかし、それでも以下のような不満がありました。

- ディレクトリごとに履歴を持ってほしい
  - ある特定のディレクトリでのみ使うコマンドなど
    - `git checkout ブランチ` とか (git 系全般にいえる)
    - プロジェクトのリポジトリとか
  - tmux などで zsh を複数立ち上げているときなどにヒストリーを混同したくない
- コマンド履歴にタグを付けたい
  - コメント (interactive_comments オプション) をつけて保持しておきたい
  - あとあと検索が楽になる
- すべての履歴を保持したい
  - 何件まで保存、などは考えたくない
  - 数年前の履歴も引き出せるようにしておきたい
  - ただし数十万〜件になろうともパフォーマンスは落としたくない
  - 標準のヒストリーは数十 MB にもなると、もたつく等の報告例あり
- 特定の月に使用したコマンド履歴を出したい
  - 一定期間だけ違うプロジェクトにアサインされていたとか
- substring search したい
  - これもディレクトリごとにできるとよし
- history が壊れないような仕組みがほしい
  - 突然壊れたとの報告例あり (自分は経験したことないけど)
  - Twitter で検索すると嘆いている人が多い

zsh のオプション (`setopt`) や Third-party 系のプラグインなどを併用すれば一部の課題は解決できるのですが、同時に満たしてくれるものはなく自作しました。

## zsh-history

{{< hatena "https://github.com/b4b4r07/zsh-history" >}}

### 特徴

上に挙げた不満点をすべて解消するような感じになっています。

それ以外の特徴として、

- sqlite3 にデータを持つ (スキーマについては以下)
  - SQL を解釈する I/F を持つ
  - peco ライクな専用のセレクタ UI を持つ
- コマンド実行直後に DB に記録
  - 実行コマンドとステータスコード
- zle から呼ばれた場合は BUFFER に選択内容を展開する (いわゆる zsh の widget)

詳しくは次の GIF をみてください。

![](https://cl.ly/032Z0Y2Z0Q2v/c.gif)

### `history` テーブル

テーブル構成はこんな感じです。

カラム名 | 型 | 説明
---|---|---
id | int | 通し番号
date | string | 実行後の日付 (`%F %T` 形式)
dir | string | 実行時のディレクトリ
command | string | 実行したコマンド
status | int | ステータスコード (`$?`)
host | string | ホスト名

変わるかもしれません。

### インストール

内部で golang 製の zhist というコマンドを使用します。ビルドが必要です。

```bash
$ git clone https://github.com/b4b4r07/zsh-history && cd zsh-history
$ make && sudo make install
$ source init.zsh
```

### 使い方

デフォルトでは既存のキーバインドを上書きしないように、何も設定されていません。
以下の環境変数で設定できるようになっているので適宜変更してください。

```zsh
# DB パス
export ZSH_HISTORY_FILE="$HOME/.zsh_history.db"
# コマンドラインセレクタ (先頭から順番に使われる)
export ZSH_HISTORY_FILTER="fzy:fzf:peco:percol"

# peco などと組み合わせて検索するためのキーバインド
# そのディレクトリで使用したコマンドしか候補に出さないか、
# 今までの履歴を全部候補に出すか切り分けらる
export ZSH_HISTORY_KEYBIND_GET_BY_DIR="^r"
export ZSH_HISTORY_KEYBIND_GET_ALL="^r^a"

# 専用のセレクタ I/F から SQL を実行する
export ZSH_HISTORY_KEYBIND_SCREEN="^r^r"

# substring 系のキーバインド
# BUFFER (コマンドライン) に何もなければ通常の動作
export ZSH_HISTORY_KEYBIND_ARROW_UP="^p"
export ZSH_HISTORY_KEYBIND_ARROW_DOWN="^n"
```

また、zsh-history では DB のバックアップをサポートしています (これが飛んだらおじゃんなので...)。
一日一回コマンド実行時に、そのときの時点の DB ファイルを昨日付けのデータとして `$ZSH_HISTORY_BACKUP_DIR` に保存します。

```bash
$ tree $ZSH_HISTORY_BACKUP_DIR
/Users/b4b4r07/.zsh/history/backup
`-- 2017
    `-- 02
        |-- 13.db
        `-- 14.db

2 directories, 2 files
```

うっかり DB ファイルを消した際はここからリストアしてください (多少の差分ができることは悪しからず)。

#### zhist について

golang 製の CLI ツールです。zsh-history で使われており、sqlite3 とのつなぎ込みを行います。
挙動は toml によって制御できます。

```toml
# -s (スクリーンモード) で起動したときのプロンプト
prompt = "sqlite3> "
# -s で起動したときに最初に実行される SQL
init_query = "SELECT DISTINCT(command) FROM history WHERE command LIKE '%%' AND status = 0 ORDER BY id DESC"
# -s で起動したときのカーソル位置を制御する (% に移動)
init_cursor = "%"
# -s で ESC を押したときに Vim のノーマルモードに移行する
# そのときに表示するシンボル
vim_mode_prompt = "VIM-MODE"
# DB に登録しない文字列とか
ignore_words = [
    "false",
    "echo",
]
```

`~/.config/zhist/config.toml` が使われます。存在しない場合は、上記の内容をデフォルト値として toml を作成します。

ただし、これから変更される可能性があります。

### マイグレーション

申し訳程度にマイグレーションスクリプトを同梱しているので、標準のヒストリーを使っている方は以下を実行して `~/.zsh_history` からインポートしてください (既存のヒストリーが壊れることはありません)。

```console
$ source misc/migrations.zsh | sqlite3 $ZSH_HISTORY_FILE
```

(横着して書いたため `sqlite3` が必要です)

## まとめ

だいぶ便利です。使ってみてください。

[repo]: https://github.com/b4b4r07/zsh-history
