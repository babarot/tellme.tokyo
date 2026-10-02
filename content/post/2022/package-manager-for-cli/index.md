---
title: "コマンドラインツール向けのパッケージマネージャを作った"
date: "2022-03-02T00:00:00+09:00"
description: ""
draft: true
hidden: false
toc: false
tags: []
---

(2026/10/03追記): 今は afx を使っておらず、dotfiles のパッケージ管理は Nix に移した。ただ、ツールのインストールと設定を同じ場所に書くという afx の考え方はそのまま引き継いでいる。その話は [dotfiles を AI agent のために作り変えた](/post/2026/10/01/ai-agent-first-dotfiles/) に書いた。

[afx](https://github.com/babarot/afx) という CLI 向けのパッケージマネージャを公開した。ここでいう CLI のパッケージは、jq のようなコマンドラインツールや、[zsh-history-substring-search](https://github.com/zsh-users/zsh-history-substring-search) のようなシェルのプラグイン（bash/zsh/fish）のこと。afx はこれらを1つのツールで、しかも YAML に書いたコードとして管理するためのもの。

もう1つの特徴は、パッケージとそのツールの設定を一緒に書けること。例えば jq のインストール方法と、jq で使う環境変数やエイリアスを同じ YAML に書ける。設定が bashrc や zshrc にばらばらに散らかったり、もう使っていないツールの設定だけが残っていたり、ということがなくなる。

```yaml
# ~/.config/afx/commands.yaml
github:
- name: stedolan/jq
  description: Command-line JSON processor
  owner: stedolan
  repo: jq
  release:
    name: jq
    tag: jq-1.6
  command:
    link:
    - from: '*jq*'
      to: jq
    alias:
      jq: jq -C
    snippet: |
      # you can write shell script here
      # -> define global alias (zsh feature)
      if [[ $SHELL == *zsh* ]]; then
        alias -g J='| jq -C . | less -F'
      fi
```

```yaml
# ~/.config/afx/plugins.yaml
github:
- name: b4b4r07/enhancd
  description: A next-generation cd command with your interactive filter
  owner: b4b4r07
  repo: enhancd
  plugin:
    env:
      ENHANCD_FILTER: fzf --height 25% --reverse --ansi:fzy:peco
    sources:
    - init.sh
```

## 背景

昔、Zsh のプラグインマネージャである [zplug](https://github.com/zplug/zplug) を作った。Zsh のプラグインだけでなく、GitHub Release に上がっているバイナリ（jq など）も一緒にインストールでき、設定はパッケージごとに zshrc に書く作りだった。

```bash
# .zshrc
zplug "stedolan/jq", \
  as:command, \
  from:gh-r, \
  rename-to:jq
```
```bash
# .zshrc
zplug "b4b4r07/enhancd", as:plugin, use:init.sh
if zplug check "b4b4r07/enhancd"; then
  export ENHANCD_FILTER="fzf --height 25% --reverse --ansi"
  export ENHANCD_DOT_SHOW_FULLPATH=1
fi
```

コマンドラインツールまで扱ったのは、Homebrew にない便利なツールの多くが GitHub Release で配られていたから。それに Homebrew は入れたらおしまいになりがちで、環境を新しくするたびに「何を入れてたっけ」がついて回る（`brew list` すればいいとも言えるが、宣言的ではない）。プラグインもツールも1つの方法で、再現できる形で管理したかった。

ただ、zplug はピュアな Zsh script で書いていたので、機能が増えるにつれて読めず、デバッグもテストもできないコードになった。黒魔術のような Zsh script[^zsh-magic] を前に「これはもうメンテできない」となり、社会人になって時間が減ったこともあって、数年のうちに自分でも使わなくなった。

それでもツールを管理したい気持ちは残る。手動でダウンロードして PATH に置いたツールは、PC を新しくするたびに入れ忘れてそのまま失われた。インストールと管理が別々だと漏れるなと思い直し、Go で小さなツールを書いて、3年くらい private リポジトリでひっそり使っていた。ただ適当なコードだったので新しい環境では毎回エラーが出て、騙し騙し使っていた[^bootstrap]。それにもうんざりしてきたので、大きく手を入れて afx として公開した。

## 使い方

詳しい使い方は [Getting Started - AFX](https://babarot.me/afx/getting-started/) にある。

インストールしたいパッケージを YAML に書いて `afx install` を実行する。設定は `afx init` がシェルスクリプトとして出力するので、rc ファイルで読み込む。

```bash
# bashrc などに書く
source <(afx init)
```

`afx init` は YAML の設定を標準出力に書き出すだけなので、気軽に実行して中身を確かめてよい。`source` してはじめてシェルに反映される。

インストールは YAML に書いて `afx install`、アンインストールは YAML から消して `afx uninstall`、アップデートはバージョンを書き換えて `afx update`。afx は常に、YAML に書かれた状態と手元を一致させようとする。例えば exa を更新するなら、`tag` を書き換えて `afx update` を実行する。

```diff
  github:
  - name: ogham/exa
    description: A modern version of 'ls'.
    owner: ogham
    repo: exa
    release:
      name: exa
-     tag: v0.9.0
+     tag: v0.10.0
    command:
      alias:
        l: exa --group-directories-first -T --git-ignore --level 2
        ls: exa --group-directories-first
        la: exa --group-directories-first -a --header --git
        ll: exa --group-directories-first -l --header --git
        lla: exa --group-directories-first -la --header --git
      link:
      - from: '*exa*'
        to: exa
```

## 設定方法

パッケージの取得元として、今のところ次の4つに対応している。

- GitHub / GitHub Release
- Gist
- HTTP（上記以外のウェブサイトで配信されているもの）
- Local（ダウンロード済みのもの）

取得元ごとに書き方は違うが、どれにも共通して `command` と `plugin` を設定できる。`command` は PATH を通すコマンドラインツール、`plugin` はシェルに source するプラグインとして扱われる。

ほかに設定できるのは次のようなもの。

- 環境変数
- エイリアス
- 依存関係（パッケージを読み込む順序）
- 任意のスニペット（パッケージに合わせた関数の定義など）
- 条件に応じた読み込み
- `command` の場合
  - バイナリのリネーム
  - ビルドコマンドの実行
  - ビルドするときの環境変数

詳しくは[ドキュメント](https://babarot.me/afx/configuration/package/github/)にある。実際の設定例としては、自分が使っていたパッケージの分だけだが [dotfiles](https://github.com/babarot/dotfiles/tree/70f459b90c4c8a3e84344550d7a6c2fb1bfb15eb/.config/afx) に置いてある。

## おわりに

zplug の代わりとして手元で育てていた CLI 向けのパッケージマネージャを、ようやく公開した。Homebrew で入らないツールを管理したい人、Homebrew で入るものもまとめて管理したい人、インストールと設定をコードにして環境構築を再現できるようにしたい人には向いていると思う。

ビルドの実行にも対応しているので、Homebrew にも GitHub Release にもなく、make や go get でしか入れられないツールもまとめて管理できる。

コード: https://github.com/babarot/afx

[^zsh-magic]: 例えば `${^path[@]}/zplug-*(N-.:t:gs:zplug-:)` や `${(qqq)name}${tags[@]:+", ${(j:, :)${(q)tags[@]}}"}` など。
[^bootstrap]: GitHub Release に上がっているファイルの命名規則（OS 名やアーキテクチャなど）がバラバラで、判定処理をちゃんと書くのが面倒だったので、簡単なものを書いたあとはずっと後回しにしていた。おかげで新しい環境では、設定もないまっさらな vim で動かない部分をコメントアウトしてビルドし、それで vim をインストールする（そこでやっと vim の設定も効く）という状態だった。
