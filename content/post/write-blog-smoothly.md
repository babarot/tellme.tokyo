---
title: "スムーズに Hugo でブログを書くツール"
date: "2018-10-16T13:18:07+09:00"
description: "Hugo でブログを書くときに便利にするツールを Go で書いた話"
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
- blog
- go
- hugo
---

このブログ ([b4b4r07/tellme.tokyo](https://github.com/b4b4r07/tellme.tokyo)) ではマークダウンで記事を書き、[Hugo](https://gohugo.io/) を使って静的ファイルを生成して GitHub Pages でホスティングしている。

とても便利なのだが、いくつか面倒な点がある。

- リアルタイムに記事のプレビューが見たいとなると、`hugo server -D` する必要があり、都度別コンソールで立ち上げるのが面倒
- 記事をあたらしく書き始めるとき `hugo new post/<filename>.md` を打つのが面倒
- 過去記事を編集するのが面倒
- `hugo` を実行すると draft の記事も生成されてしまう (index には載らないが、生成されるので commit してしまう)

いろいろ面倒なので、Hugo でブログを書くだけのツール (hugo wrapper) を書いた。
`hugo` の上位互換というわけではなく、必要な機能の不便な部分だけを Override しているだけのツールなので合わせて使っていく。

[tellme.tokyo/cmd/blog at master · b4b4r07/tellme.tokyo](https://github.com/b4b4r07/tellme.tokyo/tree/master/cmd/blog)

```
Usage: blog [--version] [--help] <command> [<args>]

Available commands are:
    edit    Edit blog articles
    new     Create new blog article

```

簡単な CLI ツールになっていて、ブログを編集するときに `blog edit` とすれば [fzf](https://github.com/junegunn/fzf) が立ち上がって記事を選択できるようになっている。

```console
$ blog edit
>
  39/39
> スムーズに Hugo ブログを書くツール
  Windows 時代の使用ソフト晒し
  Bind Address で少しハマった話
  Hugo で PlantUML のようなシーケンス図を描画する
  Kubernetes 上で Credentials を扱う
  HashiCorp Vault の Unseal と Rekey
  東京衣食住
  Microservices Platform Meetupで話した
  『ルポ川崎』を読んだ
```

fzf との連携は [b4b4r07/go-finder](https://github.com/b4b4r07/go-finder) でやっている[^1]。

選択するとエディタ (Vim) が立ち上がり、バックグラウンドでは `hugo server` が立ち上がるようになっている。

```go
	ctx, cancel := context.WithCancel(context.Background())
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)
	defer signal.Stop(ch)
	defer cancel()
	go func() {
		select {
		case <-ch:
			cancel()
		case <-ctx.Done():
		}
	}()

	go newHugo("server", "-D").setDir(c.Config.BlogDir).Run(ctx)

	vim := newShell("vim", files...)
	return vim.Run(context.Background())
```

そのため、すぐに http://localhost:1313 でプレビューを見ることができる。
このプロセスが閉じると hugo のプロセスも閉じるため、記事の編集が終わるとプレビューは終わる。

他にもいろいろ機能はあるし、追加もしていくけど、とりあえずこれでスムーズにブログが書けるようになった。

[^1]: [Go から peco する | tellme.tokyo](https://tellme.tokyo/post/2018/04/25/go-finder/)
