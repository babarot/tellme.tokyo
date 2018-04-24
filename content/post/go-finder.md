---
title: "Go から peco する"
date: "2018-04-25T02:11:37+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["go", "golang", "fzf", "peco"]

---

[peco](https://github.com/peco/peco) とか [fzf](https://github.com/junegunn/fzf) のようなフィルターコマンドが便利すぎて使わない日はないのですが、これらをどうしてもGoプログラムに組み込んでしまいたいときが稀にあります。

どちらも Go で書かれているので、ライブラリとして使えるように提供されていれば import するだけなのですが、どちらも CLI (Command Line Interface) のみを提供しています。
CLI として作られている以上、シェルコマンドとして使うべきではあるのですが、そうすると何かと連携させたいとなった場合 (多くの場合はそうですが)、シェルスクリプトを書くことになります。
小さなものであればそれで構わないのですが大きめなツールになる場合、基本的にシェルスクリプトを書きたくないわけで、そうするとやはりどうしても Go から扱いたくなります。

CLI (シェルコマンド) といっても、アプリケーションに精通したインターフェースである API (Application Programming Interface) と似たようなもので、 CLI の場合、コマンドラインに精通したインターフェースを持っているわけです。
そう考えると CLI のオプションはそのインターフェイスを通してコマンドに処理の変更を伝える起点と捉えることができます。
Go ではコマンドラインインターフェースとやりとりできる [`os/exec`](https://golang.org/pkg/os/exec/) が標準パッケージとして使えるので、これをうまく使って CLI との通信部分を抽象化してラッパーライブラリとして実装できないか考えてみました。

https://github.com/b4b4r07/go-finder

go-finder というパッケージを作りました。

使い方は次のようになります。

[finder - GoDoc](https://godoc.org/github.com/b4b4r07/go-finder)

```go
fzf, err := finder.New("fzf", "--reverse", "--height", "40")
if err != nil {
	panic(err)
}
fzf.Run()
```

```go
peco, err := finder.New("peco", "--layout=bottom-up")
if err != nil {
	panic(err)
}
peco.Run()
```

デフォルトでは `os.Stdin` からの入力をデータソースとして使用します。
`finder.New()` が返す `*finder.Finder` には `Source` というフィールドが定義されていて、自由にデータソースを設定することができます。
以下のようなよく使用されるソースに関しては、デフォルトでメソッドを提供しています。

```go
peco, _ := finder.New("peco")
peco.FromFile("some-file.txt")
peco.FromText("sample\ntext\nfoo")
peco.FromCommand("cat", "some-file.txt")
peco.FromStdin() // デフォルト
```

また、以下のように独自のデータソースも定義できます。

```go
peco.From(func(in io.WriteCloser) error {
		lines := []string{"line 1", "line 2", "line 3"}
		for _, line := range lines {
			fmt.Fprintln(in, line)
		}
		return nil
	}
}
```

peco か fzf か [percol](https://github.com/mooz/percol) といったフィルタコマンドのうち、何が使われるかわからないケースについても Go として書くことができます。

```go
var opts []string
command := finder.Command("fzf", "peco", "percol", "zaw")
switch command {
case "fzf":
	opts = []string{
		"--reverse",
		"--height", "40",
	}
case "peco":
	opts = []string{
		"--layout=bottom-up",
	}
}

cli, err := finder.New(command, opts...)
if err != nil {
	panic(err)
}

items, err := cli.Run()
if err != nil {
	panic(err)
}
fmt.Printf("%#v\n", items)
```

`finder.Command()` は引数にとったコマンドのうち、使用できる (PATH が通っている) コマンドを教えてくれるのでそれに合わせてオプションを定義します。

以上のように、go-finder ではこれらのフィルタコマンドをラップしてあげることで Go で扱いやすくなりました。

これにより、[enhancd](https://github.com/b4b4r07/enhancd) の Go 化ができそうです。
