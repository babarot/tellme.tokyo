---
title: "最強のヒストリ補完を作りました"
date: 2017-06-13T23:33:05+09:00
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2017/06/13/233305"
tags:
- shell
- go
---

# 最強のヒストリ補完を求めて

シェルヒストリに不満を持っていたので自作しました。今の自分にとっては必要な機能を盛り込んでいて便利に使えていますが、誰かにとっては、もしくは数カ月後の自分にとってはぜんぜん最強じゃないかもしれないです。

以前このようなエントリを書きました。

http://www.tellme.tokyo/entry/2017/02/14/214231

このころから (いやもっと前から) シェルのヒストリ補完に不満を持っていました。

- 単純にデフォルトの C-r だと目的のものを探しづらい
  - 例えばコマンド名の一部だけだとノイズが多すぎる
  - けどディレクトリは覚えているからそれでもフィルタしたい、とか

他にも色々あって (その理由について先のエントリを見てもらうとして) zsh-history というツールを書きました。

{{< hatena "https://github.com/b4b4r07/zsh-history" >}}

このときは最強のヒストリ補完ができたと、嬉々として先程のエントリを書いたのです。
しかし、まあ数ヶ月使っていると不便な点が見えてきて、

- 複数ホスト間でもヒストリ共有したい
- ディレクトリだけではなくブランチごとに履歴を持ちたい
- カジュアルに履歴を消したい
- などなどの変更を加えるときに SQLite3 だとめんどい
- パフォーマンスは落ちるかもしれないけどテキストで持ってたほうが何かと便利かも

みたいなことが相まって作り直そうと思ったわけです。

# 新しく作った

## 特徴など

前回のネーミングセンスなさから変わらず、単に history となっています (そもそも前回のときのも `zsh-` prefix をつける必要性なかったので)。

{{< hatena "https://github.com/b4b4r07/history" >}}

何ができるかというと、

- peco/fzf などでフィルタできる
- ブランチとかディレクトリに限定してフィルタできる (任意)
- 自動でバックアップしてくれる
- gist 経由で同期できる
    - `GITHUB_TOKEN` さえ渡せばよしなにやってくれるので、ユーザは他の PC でトークンを設定して `history sync` するだけ
- 同期のタイミングとか時間間隔とか差分量 (100 行以上で同期、など) の設定ができる
- 履歴を直接編集できる
- zsh intergrate は書いてるので `source misc/zsh/init.zsh` すれば一通り動く
	- [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) っぽいものを同梱している (なので zsh-syntax-highlighting は不要)

などです。詳しくは README を見てください (あんまり書いてないですけど)。

### インストール、使い方

とりあえず使いたかったら、

```
$ brew install b4b4r07/history/history
```

としたあとに以下を zshrc に書き込んでください (他の installation については README にて)。これが最小限の設定になります。

```bash
ZSH_HISTORY_KEYBIND_GET="^r"
ZSH_HISTORY_FILTER_OPTIONS="--filter-branch --filter-dir"
ZSH_HISTORY_KEYBIND_ARROW_UP="^p"
ZSH_HISTORY_KEYBIND_ARROW_DOWN="^n"
```

`$GITHUB_TOKEN` が設定されていて、`$ZSH_HISTORY_AUTO_SYNC` が `true` なら `history sync` をしたときか、前回の同期時間から1時間 (`$ZSH_HISTORY_AUTO_SYNC_INTERVAL`) 経過するか、リモートとローカルの差分量が 100 行を超えたら、

```
~/.config/history/history.ltsv: sync immediately? [y/n]:
```

と聞いてくるので `y` とすれば同期します。ユーザが同期するタイミングを意識することはあまりないです。

## カスタマイズ

細かいカスタマイズは `history config` からできます。
設定は TOML ファイルです。ここらへんのメカニズムは [mattn/memo](https://github.com/mattn/memo) リスペクトです。

※ 似たような構造を持ったツールを何個か作りました (宣伝: [b4b4r07/gist](https://github.com/b4b4r07/gist), [b4b4r07/crowi](https://github.com/b4b4r07/crowi)。

基本的に、`^r` (Ctrl-r) としたときに立ち上がるのは `history search` です。

カレントのディレクトリやブランチに限定したい場合は `--filter-XXXX` というオプション (例えば、`--filter-branch`) をつければ最初から絞られて [peco](https://github.com/peco/peco) や [fzf](https://github.com/junegunn/fzf) に渡るようになっています。

また `--filter-XXXX` 系のオプションは peco/fzf (コード上、Screen と呼ぶ) を介する UI のときに使用できて、それぞれを付けて実行するのが面倒な場合は設定ファイルから一括して変更できます。優先順位としては、「各オプションの値」＞「設定ファイルの値」です。

```toml
[screen]
  filter_dir = false
  filter_branch = false
  filter_hostname = false
```

各サブコマンドのオプションや使い方については `history help <CMD>` としてください。

このときに立ち上がる画面にあるカラムはユーザが自由に定義できて、デフォルトでは

```toml
[screen]
  columns = [
      "{{.Time}}", 
      "{{.Status}}", 
      "{{.Command}}",
  ]
```

となっています。以下のスクリーンショットからも分かるかと思います。

{{< img src="20170613234337.png" width="500" >}}

他にも以下のようなテキストテンプレートが使えるので自分好みのカラムを組み合わせることが出来ます。

テンプレート名 | 説明 | 例
---|---|---
`{{.Date}}` | 実行した日付 | 2006-01-02
`{{.Time}}` | 読みやすい感じの日時 | 12 hours ago
`{{.Command}}` | 実行したコマンド | `curl example.org | jq -r '.message'`
`{{.Dir}}` | 実行したディレクトリ | `/h/b/s/g/b/history`
`{{.Path}}` | そのフルパス | `/home/b4b4r07/src/github.com/b4b4r07/history`
`{{.Base}}` | 親ディレクトリのみ | `history`
`{{.Branch}}` | 実行したブランチ | `master`
`{{.Status}}` | 終了コード | ` ` / `x`

このツールは LTSV に履歴データを持ちます。

```
date:2017-06-13T01:32:24.494724589+09:00	command:ls /Users/b4b4r07/Library/Caches/Homebrew/	dir:/Users/b4b4r07/src/github.com/b4b4r07/homebrew-history	branch:master	status:0	hostname:babarot-mb.local
```

`history edit` で直接編集することも出来ます (`vim $(history config --get history.path)` と等価です)。

テキストでデータを持つため sqlite3 の実装よりは落ちると思われます。その際は無駄なコマンドを履歴に持たないようにすると良いかもしれないです。`history add` のときにフィルタを掛けるのです。

```tom
[history]
  ignore_words = [
      '^\w+$', 
      '^cd -+(\w)?$', 
      '^hs\s+\S',
  ]
```

ignore_words を指定できるようになっていて、このように一語 (`ls`, `pwd` など) のみで構成されるコマンドラインは後から検索する必要性もないのでノイズカットにもなって一石二鳥かもしれません。

最後にこの履歴データの共有です。history は Gist を使います。true になっていると勝手にシェアを始めます (最低限 `$GITHUB_TOKEN` が必要です)。勝手に、と言ってもプライベートモード (Secret) で作るので URL が流出しなければ履歴が覗かれることはありません。

```
[history]
  [history.sync]
    id = "" #ここは空で問題ないです (初回の同期のとき history.ltsv ファイルを探してきて補完してくれます)
    token = "$GITHUB_TOKEN" #この環境変数に値を入れるか、ここを書き換えてトークンを直書きしてください
    size = 100 # リモートとの差分行数に応じて同期します
```

URL 流出が嫌な人やそのそも 1 台しか PC を持っていないなどの理由があれば同期する必要はないのでオプションを false にすると良いでしょう。

```bash
export ZSH_HISTORY_AUTO_SYNC=false
```

ちなみに1日1回、ローカルにバックアップを取っています。なのでバックアップの観点から Gist を使う強い理由はないです。

```
$ tree ~/.config/history/.backup/
~/.config/history/.backup/
└── 2017
    └── 06
        ├── 06
        │   └── history.ltsv
        ├── 07
        │   └── history.ltsv
        ├── 08
        │   └── history.ltsv
        ├── 09
        │   └── history.ltsv
        ├── 10
        │   └── history.ltsv
        ├── 11
        │   └── history.ltsv
        ├── 12
        │   └── history.ltsv
        └── 13
            └── history.ltsv

10 directories, 8 files
```

# 最後に

使いながら作っていたのでいい感じにフィットする使い勝手になっているように思います。

ところで、gist により履歴の共有は大変便利なのですが、クレデンシャルな情報の取り回しすごい面倒だなー (secret gist とはいえ生のアクセストークンとかが乗るのはあれですよね...) なんて思っていたところ (いや、そもそもコマンドラインで打つなよ的なあれもありますが...)、タイムリーにも id:itchyny さんによる便利ツールが公開されました。

{{< hatena "https://github.com/itchyny/fillin" >}}

併せて使うと便利そうです。

また、このヒストリを使うことで検索は便利になるのですが、稀に必要になるような長いスニペットは [knqyf263/pet](https://github.com/knqyf263/pet) を使ってもいいでしょう。
