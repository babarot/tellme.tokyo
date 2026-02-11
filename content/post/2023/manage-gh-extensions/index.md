---
title: "gh extension の管理"
date: "2023-03-21T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---

## gh とは

[gh](https://github.com/cli/cli) とは GitHub が公式で開発している GitHub CLI クライアントである。

いつものようにMarkdown を書いていると、見慣れた GitHub の CSS でプレビューしたいな (N 度目) と思いいくつかの Markdown エディタで GitHub テーマを適用してほぼオリジナルに近いプレビューできるのはどれだと探してきたが、どこかしら微妙に違ってまだ出ていないかと諦めていた。

そんなときにこのブログを見た。

[READMEをpush前にプレビューできるGitHub CLI拡張を作った - ゆーすけべー日記](https://yusukebe.com/posts/2021/gh-markdown-preview/)

{{< img src="https://user-images.githubusercontent.com/10682/138411417-dd12a831-bacc-4b05-a33d-47d3f6b45483.png" width="600" >}}

めっちゃ GitHub。Live-reloading もできるし「これだよ! これ!」という感じ。どうやら gh コマンドの拡張機能 (extension) として公開されているらしい。

[yusukebe/gh-markdown-preview](https://github.com/yusukebe/gh-markdown-preview)

```console
$ gh extension install yusukebe/gh-markdown-preview
```

これでインストールができる。めっちゃかんたん。ここで gh extension というのがあるのだと知り、探してみると色々あることに気づく。gh コマンドが出た当初はこんなものはなかった気がするので、自分が使わなかったうちに相当開発が進んでいたらしい。

[GitHub CLI extension](https://github.com/topics/gh-extension)

そうなると色々試したくなる。おもしろそうと思って色々インストールしているうちにたくさんになった。

```console
$ gh extension list
gh branch  mislav/gh-branch              b2e79733
gh dash    dlvhdr/gh-dash                50cd7818
gh md      yusukebe/gh-markdown-preview  v1.4.0
gh poi     seachicken/gh-poi             v0.9.0
gh q       kawarimidoll/gh-q             5dc627f3
```

手持ちの環境は2台 (会社用、個人用) なのでいい感じに同期しておきたく [dotfiles にブチ込む用のスクリプト](https://github.com/b4b4r07/dotfiles/commit/c3da13fc27b4aad165487043b894c7c69c6e343f)[^1]を書いた。

```bash
#!/bin/bash
gh extension install mislav/gh-branch
gh extension install dlvhdr/gh-dash
gh extension install yusukebe/gh-markdown-preview
gh extension install seachicken/gh-poi
gh extension install kawarimidoll/gh-q
```

これでもいいけど install とスクリプトへの追加が別になっているとインストールはしたけどスクリプト側を更新するの忘れてた、になるのがイケてない。

どうしたものかと思っていたら [afx](https://github.com/b4b4r07/afx/) があったじゃないかと思い出す。afx は開発ツール版 Terraform みたいなもので、YAML に書いたものをインストール・アップデートできるなど持続的な管理ができる。これに gh extension を対応させてしまおうというのが今回のお話。


## gh を管理する

本題。

[Support gh extension by b4b4r07 · Pull Request #58 · b4b4r07/afx](https://github.com/b4b4r07/afx/pull/58)

CLI コマンド向けパッケージマネージャーである [afx](https://github.com/babarot/afx) に as.gh-extension というパラメータを追加して gh extension ですよと認識させるようにした。あとは YAML を書いて afx install するだけになる。ちなみに rename-to というパラメータを追加したので、`gh markdown-preview` のように長いコマンドも `gh md` にエイリアスすることができて便利になった。

(gh は呼び出す実装が gh 側のロジックによる部分が大きいため `alias gh-md=gh-markdown-preview` では動かない)

```yaml
github:
- name: yusukebe/gh-markdown-preview
  description: GitHub CLI extension to preview Markdown looks like GitHub.
  owner: yusukebe
  repo: gh-markdown-preview
  as:
    gh-extension:
      name: gh-markdown-preview
      tag: v1.4.0
      rename-to: gh-md
```

- 例: [gh-extensions.yaml](https://github.com/b4b4r07/dotfiles/blob/main/.config/afx/gh-extensions.yaml)
- ドキュメント: [GitHub - AFX](https://babarot.me/afx/configuration/package/github/#as)

[^1]: [その後](https://github.com/b4b4r07/dotfiles/commit/439c1580c1eade1f979e65460de860bbb30fac2c)
