---
title: "Go のコマンドラインツールを簡単にリリースする"
date: "2019-02-15T01:09:19+09:00"
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: ""
tags:
- go
---

[goreleaser](https://github.com/goreleaser/goreleaser) のおかげで Go のバイナリをクロスプラットフォーム向けにビルドしてパッケージングして GitHub Releases にアップロードするステップがだいぶ簡単になった。

今までは、[gox](https://github.com/mitchellh/gox) + [ghr](https://github.com/tcnksm/ghr) などを使ってそれらをスクリプト化したものを各リポジトリに用意する必要があったのが、今では goreleaser 用の設定ファイル (YAML) を置くだけでよくなった。

例: [stein/.goreleaser.yml at master · b4b4r07/stein](https://github.com/b4b4r07/stein/blob/master/.goreleaser.yml)

しかしそれでもリリースするにあたっていくつかのプロセスが残っている。

- tag 打ち
- バージョン情報の更新
- Changelog の更新

それらをスクリプト化して各リポジトリに置くと、スクリプトに改修や機能追加すると各リポジトリでアップデートしなきゃいけなかった。自分向けなので必ずやらなきゃいけないわけではないけど、毎回シェルスクリプトを書くのも億劫だし、git.io を使って共用できるようにした。

[b4b4r07/release-go](https://github.com/b4b4r07/release-go)

使い方は簡単で raw のスクリプトを curl などで取ってきて bash にわたすようにする。

実際は Makefile なんかに書いておくとより便利になる。

```make
.PHONY: release
release:
	@bash <(wget -o /dev/null -qO - https://git.io/release-go)
```

これを実行すると、

- [gobump](https://github.com/motemen/gobump) を使って semver 形式で bump up
- [git-chglog](https://github.com/git-chglog/git-chglog) を使っている場合は Changelog の更新
- goreleaser の実行

を必要に合わせてプロンプト経由で対話的に実行することができる。
