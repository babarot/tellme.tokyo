---
title: "GitHub のラベルを宣言的に管理する"
date: "2018-11-19T20:08:07+09:00"
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
- github
- golang
---

## ソフトウェアの宣言的設定について

"何かを管理する"となったときに、宣言的に設定できるようになっていると非常に便利である。
この宣言的設定 (Infrastructure as Code) とは、イミュータブルなインフラ (Immutable Infrastructure) を作るための基本的な考え方で、システムの状態を設定ファイルにて宣言するという考え方である。
具体的には Kubernetes のマニフェストファイル (YAML) だったり、Terraform のコード (HCL) が挙げられる。
この考え方は、インフラ領域に限らず、何らかの状態管理にはもってこいの手法である。

GitHub のラベルは Issues/P-Rs を管理するために便利な機能である。
しかし、リポジトリの規模やラベルの数が増えてくると、ラベル自体も管理する必要が出てくる。
実際に Kubernetes 規模のリポジトリになると、ラベル管理なしにはやっていられない。
ラベルを管理するための [bot](https://github.com/kubernetes/test-infra/tree/master/prow) やツールすら動いている。
実際に Kubernetes のコミュニティでは現在 180 個近くのラベルが定義されており、同様のラベルが導入されているリポジトリが数十個ある。

- [Labels - kubernetes/community](https://github.com/kubernetes/community/labels)

1つのリポジトリのラベルを管理するくらいならマニュアルでも可能だが、複数リポジトリとなるとリポジトリ間の同期が大変になってくる。
特に ZenHub などの GitHub Issues を使ったマネジメントをしている場合、ラベル名が一致されていることとその付随情報 (色や説明) の同期が必須になる。
人間が手で追加や変更をしていると、必ず差異が発生する。

ここで、冒頭に挙げた宣言的設定が有効な手段になる。

## github-labeler の紹介

https://github.com/b4b4r07/github-labeler

宣言的設定の手法をラベル管理に持ち込むために、GitHub ラベルの定義とそれを作るリポジトリについて「YAML に書いたとおりになる」ツールを書いた。

例えば次のような YAML を書く。

```yaml
labels:
  - name: area/security
    description: Indicates an issue on security area.
    color: 1d76db
  - name: kind/bug
    description: Categorizes issue or PR as related to a bug.
    color: d93f0b
  - name: kind/cleanup
    description: Categorizes issue or PR as related to cleaning up code, process, or technical debt.
    color: bfd4f2
  - name: kind/design
    description: Categorizes issue or PR as related to design.
    color: bfd4f2
  - name: kind/documentation
    description: Categorizes issue or PR as related to documentation.
    color: bfd4f2

repos:
  - name: org/repo1
    labels:
      - area/security
      - kind/api-change
      - kind/bug
      - kind/cleanup
      - kind/design
  - name: org/repo2
    labels:
      - kind/api-change
      - kind/bug
      - kind/cleanup
      - kind/design
```

この YAML をもとに github-labeler を実行すると、こんな感じになる。

```bash
$ github-labeler
2018/11/19 18:30:40 create "area/security" in org/repo1
2018/11/19 18:30:40 create "kind/api-change" in org/repo1
2018/11/19 18:30:40 create "kind/bug" in org/repo1
2018/11/19 18:30:40 create "kind/cleanup" in org/repo1
2018/11/19 18:30:40 create "kind/design" in org/repo1
2018/11/19 18:30:41 create "kind/documentation" in org/repo1
2018/11/19 18:30:42 delete "bug" in org/repo1
2018/11/19 18:30:42 delete "deplicate" in org/repo1
2018/11/19 18:30:42 delete "enhancement" in org/repo1
2018/11/19 18:30:42 delete "good first issue" in org/repo1
2018/11/19 18:30:42 delete "help wanted" in org/repo1
2018/11/19 18:30:42 delete "invalid" in org/repo1
2018/11/19 18:30:42 delete "question" in org/repo1
2018/11/19 18:30:42 delete "wontfix" in org/repo1
```

![](/images/github-label-management.png)

定義されたラベル (`.labels`) が各リポジトリに存在しなければ作成し (`.repos[].labels`)、ここに羅列されていないラベルがある場合は削除するようになっている。
例えば、`org/repo2` にも `area/security` を追加したかったら、

```diff
  repos:
    - name: org/repo2
      labels:
+       - area/security
        - kind/api-change
        - kind/bug
        - kind/cleanup
        - kind/design
```

として再実行すればいいし、逆に `kind/api-change` が要らなくなったら、

```diff
  repos:
    - name: org/repo2
      labels:
        - area/security
-       - kind/api-change
        - kind/bug
        - kind/cleanup
        - kind/design
```

として再実行すればよい。
ラベルの色や説明を更新したい場合も同様である。

```diff
  labels:
    - name: area/security
      description: Indicates an issue on security area.
-     color: 1d76db
+     color: 94cde8
```

既存のラベル名を変更する場合は、以下のように設定すれば良い。

(こうせずに作り直すと、GitHub 的にラベル名の変更のつながりがなくなるので、紐付いている previous label が剥がされてしまう)

```diff
  labels:
-   - name: area/security
+   - name: area/new-name
      description: Indicates an issue on security area.
      color: 1d76db
+     previous_name: area/security
```

実行を終えてラベル名が `area/new-name` に変更されたら `previous_name:` は不要になるので、2回目以降の実行のときには消しても問題ない。

## CI と組み合わせる

宣言的設定のいいところの一つに設定をレビューしあうことができる点がある。
github-labeler には dry run の機能があるので、P-R が出されたときにレビューしつつ実行計画を見ることができる。

```yaml
version: 2
jobs:
  plan:
    steps:
      - checkout
      - run:
          name: Run github-labeler (dry-run)
          command: |
            github-labeler -manifest labels_config.yaml -dry-run
  apply:
    steps:
      - checkout
      - run:
          name: Run github-labeler
          command: |
            github-labeler -manifest labels_config.yaml

workflows:
  version: 2
  github-labeler:
    jobs:
      - plan:
          filters:
            branches:
              ignore: master
      - apply:
          filters:
            branches:
              only: master
```

上のような CI 設定 (Circle CI) を書くことで、より Infra as Code をプラクティスを持ち込むことができる。

```bash
$ github-labeler -manifest labels_config.yaml -dry-run
2018/11/19 18:45:42 create "lifecycle/stale" in org/repo1
2018/11/19 18:45:42 create "lifecycle/rotten" in org/repo1
2018/11/19 18:45:43 edit "kind/api-change" in org/repo1
2018/11/19 18:45:43 edit "kind/bug" in org/repo1
2018/11/19 18:45:44 edit "kind/cleanup" in org/repo1
2018/11/19 18:45:44 edit "kind/design" in org/repo1
2018/11/19 18:45:51 delete "kind/documentation" in org/repo1
```

## まとめ

宣言的設定をソフトウェア以外にも応用すると、レビューができるようになったり設定の状態をコードでみることができるので、とても便利になる。
これで、複数リポジトリを横断しても比較的簡単に GitHub のラベルを統一的に管理することができるようなった。
