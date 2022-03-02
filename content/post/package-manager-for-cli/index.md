---
title: "新しいコマンドラインツール向けのパッケージマネージャ"
date: "2022-03-02T20:35:20+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
image: ""
tags: ["CLI"]
---

最近、[afx](https://babarot.me/afx/) という CLI 向けのパッケージマネージャを公開した。ここで "CLI のパッケージ" とは例えば jq のようなコマンドラインツールや [zsh-history-substring-search](https://github.com/zsh-users/zsh-history-substring-search) のようなヒストリ補完をするシェルのプラグインを指す (bash/zsh/fish)。afx ではこれらを 1 つのツールで管理すること、コードで表現して管理することを目的としている。コードには YAML を使用する。

また afx では、管理するパッケージとそのツールの設定を一緒に保つことができる。例えば jq 自体の管理とその jq で使う環境変数やエイリアスの設定などを同じ YAML ファイルに記述できる。これによって、各種ツールの設定が bashrc/zshrc などに散乱することや、もう使っていないなどの理由でツール自体はインストールされていないのに設定だけが残っている、みたいなことを防ぐことができる。

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

(tl;dr)

- [zplug](https://github.com/zplug/zplug) から乗り換えるため
- Homebrew で配信されていないツールを管理するため
- 既存のパッケージマネージャより優れたものを作るため

...

昔、Zsh 向けのプラグインマネージャである [zplug](https://github.com/zplug/zplug) を作った。大学生のときに書いたので今から結構前になるけれど、その当時は Zsh のプラグインマネージャといえばたいした機能を持ったやつはなくて、自分のニーズにあったものを作ろうと書き始めた。zplug は Zsh のプラグインはもちろん、GitHub Release にアップロードされている各種バイナリ (jq など) も一緒にインストール・管理することができた。それぞれのインストールするコマンドやプラグインごとに設定を保持して zshrc に書き記すことができた。

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

zplug を作った理由に、Zsh プラグインだけではなく自分が利用しているすべてのコマンドラインツールも同じように管理したいというのがあった。Homebrew では配信されていない便利なコマンドラインツールの多くが GitHub Release で公開されていたからである。Homebrew では公式でサポートしているパッケージについては特別な設定もなく `brew` を通してインストールすることができるが、その他の野良パッケージについては作者が [Taps](https://docs.brew.sh/Taps) と言われるものを作成して Homebrew で配信できるようにするか、なければ利用者が作るほかなかったからである。

それはそれで面倒なことに変わりないが、それに加えてそもそも Homebrew で配信されているツールに関しても、Homebrew だとインストールしたらおしまいとなりがちで、環境を新調した際などには「何を Homebrew で管理してたっけ」というのが付きまとう (メモしたり `brew list` したら良いということも言えるが Declarative ではない)。つまり zplug で解決したかった課題は、"Zsh のプラグインマネージャ" という役割だけではなく、すべてのプラグインやコマンドラインツールをまとめて1つの方法で、かつ再現性ある状態で管理したいというものであった (インストールと管理が同一の方法であること)。

開発については、当時は Vim のパッケージマネージャに影響を受けてピュア Zsh script で書かれていることと、zshrc 内で記述できることを意識していた。公開当初は自分のモチベーションも高く、コードベースもそこまで大きくなかったのでメンテナンスも容易であったが、そのことがデメリットとなり高機能化するにつれてメンテナンスコストが膨れ上がった。zplug が非常に高機能であるがゆえにその 100% が Zsh script であることと、それからくる可読性の低さ、デバッグやテストの難しさから機能追加はおろかリファクタリングも難しくなっていた。

社会人となり学生の頃よりは自由な時間が減ったことも後押しして OSS としては長らくメンテしていない状態が続き、数年のうちに自分でも使うことを辞めてしまっていた。これはエラーなどが出たときに直せないのに加えて、しばらくの時間を空けてから zplug のコードを覗くと、そこで使われている黒魔術的な Zsh script [^1]に「これは到底メンテすることなどできない」という気持ちにさせられてしまうからであった。

一方で、「ツールを管理したい」という欲求自体はなくなるわけではないので、仕事や日常でいいなと思って試したりする便利ツールは手動でダウンロードして PATH に配置するなどしていた。Homebrew なども併用していたが、以前のような統一的な管理方法を失ってしまったので、野良でインストールしたツールは管理が難しくなってしまった。PC の新調のタイミングなどで今まで使っていたツールはメモやスクリプトを頼りにインストールするが、スクリプトに入れ忘れたようなやつは管理から漏れてそのままロストしてしまうこともあった。はやり、インストール (手動でダウンロード) と管理方法 (メモやスクリプト) が別々だとついつい漏れるなと思い直した。

さすがにこれではしんどいなと、簡単なシェルスクリプト[^2]を書いたりして誤魔化していたが、そのうち適当な時間を見繕って Go でもう少しリッチなやつを書いて使っていた。それから3年くらいひっそりと使い続け、環境を新調するたびにコードをちょっとずつ書き足していたが、とくに公開する予定もなくずっと private なリポジトリに置いていた。それに甘んじて適当なコードだったため毎回新しい環境で動かすたびにエラーが上がっていて騙し騙し使っていた[^3]のだけど、さすがにそれにも辟易してきていたのでコードベースに大きくテコ入れをして afx を公開するに至った。

## 使い方

詳しい使い方はドキュメントにある。

[Getting Started - AFX](https://babarot.me/afx/getting-started/)

インストールしたいパッケージの YAML を書いて afx install を実行する。設定などは afx init を実行するとシェルスクリプトとして吐き出されるので、各種 rc ファイルで読み込むようにする。

```bash
# bashrc などに書く
source <(afx init)
```

afx init の実行自体はただ標準出力に設定した項目が afx の処理を通して出力されるだけなので気軽に実行して問題ない。`source` などでシェルに反映してはじめて設定が有効化される。

各種パッケージのインストールは YAML に設定を書いて afx install を実行したら、アンインストールは YAML から消して afx uninstall を実行したら、アップデートはバージョンの部分を書き換えて afx update を実行したら完了する。afx は常に「YAML ファイルに書かれていることと一致している状態」を目指すようになっている。

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

バージョンを書き換えて `afx update` すると更新できる。

## 設定方法

afx では現在、次のパッケージタイプが用意されている:

- GitHub / GitHub Release
- Gist
- HTTP (上記以外のウェブサイトで配信されるコンテンツ)
- Local (ダウンロード済みのコンテンツ)

それぞれのパッケージタイプにはそれぞれの設定方法があるが、共通して command と plugin という設定ができる。command はコマンドラインツールとして PATH が通されることを想定し、plugin はシェルのプラグインとして source されることを想定する。

それ以外の設定では、次のようなことができる:

- 環境変数の設定
- エイリアスの設定
- 依存関係の設定 (パッケージの読み込み順序)
- 任意のスニペットコードの設定 (パッケージに合わせた function の定義など)
- 条件に応じた読み込みの設定
- (command の場合)
  - バイナリのリネーム
  - ビルドコマンドの実行
  - ビルド実行の際の環境変数の設定


その他の設定や詳しいことは[ドキュメント](https://babarot.me/afx/configuration/package/github/)に記載がある。実際の設定方法は自分が利用しているパッケージの限りであれば [dotfiles](https://github.com/b4b4r07/dotfiles/tree/master/.config/afx) にある。

## まとめ

今回、zplug alternative として作っていた CLI 向けパッケージマネージャを公開した。例えば Homebrew でインストールすることができない CLI ツールなどを管理したい人、Homebrew で配信されているものもまとめて管理したい人、インストールとその設定をコードで保存して環境構築に再現性を持たせたい人には向いていると思う。

また、ビルド実行もサポートしているので、Homebrew にもなければ GitHub Release にもない、例えば make や go get するしかインストールする方法がないといったパッケージもインストール・パッケージ管理することができる。

https://github.com/b4b4r07/afx/

[^1]: 例えば `${^path[@]}/zplug-*(N-.:t:gs:zplug-:)` や `${(qqq)name}${tags[@]:+", ${(j:, :)${(q)tags[@]}}"}` など
[^2]: URL を for-loop して git clone するやつ
[^3]: GitHub Releases に上がっているパッケージの命名規則 (OS名やアーキテクチャなど) に統一がなく、その判定処理の実装が困難だったため簡単なものを書いた後はずっと後回しにしていた。そのため、新環境を作ったときにまっさらな設定もない vim で動かない部分をコメントアウトしてビルドして、それを使って実行して vim をインストールする (vim の設定も有効になる) というような状態だった
