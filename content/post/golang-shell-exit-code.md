---
title: "golang でシェルの Exit code を扱う"
date: "2018-04-02T23:42:39+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["go", "cli"]

---

CLI ツールはよく golang で書く。
(golang でなくとも) ちゃんとした CLI ツールを書こうとすると、Exit code とそのエラーの取り回しについて悩むことが多い。
今回は、何回か遭遇したこの悩みに対する現時点における自分的ベストプラクティスをまとめておく。

**ToC**

- [Exit code とは](#exit-code-%E3%81%A8%E3%81%AF)
- [golang における Exit code](#golang-%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B-exit-code)
- [高次での取り回し](#%E9%AB%98%E6%AC%A1%E3%81%A7%E3%81%AE%E5%8F%96%E3%82%8A%E5%9B%9E%E3%81%97)
  * [CLI 側](#cli-%E5%81%B4)
  * [処理側](#%E5%87%A6%E7%90%86%E5%81%B4)
- [まとめ](#%E3%81%BE%E3%81%A8%E3%82%81)

## Exit code とは

```bash
$ ./script/something.sh
$ echo $?
0
```

`$?` で参照できる値で、0 は成功を表し、0 以外は失敗を含む別の意味を表す。取りうる範囲は 0 - 255 (シェルによって違うことがあるかも知れない)。

```bash
$ true
$ echo $?
0
$ false
$ echo $?
1
```

詳しくは、[コマンドラインツールを書くなら知っておきたい Bash の 予約済み Exit Code - Qiita](https://qiita.com/Linda_pp/items/1104d2d9a263b60e104b)

CLI ツールとはいわゆる UNIX コマンドであることが多いので、その慣習にならって実装するのよい。
成功したら 0 を、失敗したらエラーメッセージとともに非 0 を返すといった感じ。

## golang における Exit code

golang だとこんなイメージだと思う。

```go
func main() {
	// ...
	if err != nil {
		fmt.Fprintf(os.Stderr, "[ERROR] %v\n", err)
		os.Exit(1)
	}
```

これをもう少し扱いやすくした例が以下。

```go
func run(args []string) int {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "[ERROR] too few arguments\n")
		return 1
	}
	// ...
	if err != nil {
		fmt.Fprintf(os.Stderr, "[ERROR] %v\n", err)
		return 1
	}
	// ...
}

func main() {
	os.Exit(run(os.Args[1:]))
}
```

`run()` はひたすら「err」や「エラーとして扱いたいケース」をひろって標準エラー出力に表示して、Exit code を return する役割に徹する。
`main()` はその Exit code で `os.Exit()` するだけ。

## 高次での取り回し

`main.go` や main パッケージで事足りる場合は上であげたパターンで問題ないが、規模が大きくなってくるともう少し抽象化したレイヤが欲しくなってきたりする。
golang において、Exit code 周りで扱いたい要素は以下だと思っている。

- Exit code そのもの (`int`)
- エラー (`error`)
- (エラー) メッセージ (`string`)

golang のプログラム的には err で返すけど、main まで上がってきたときにそれはエラーとして扱われたくない、つまり非 0 にされたくないケースがある。
一様に `err != nil` だったら `fmt.Fprintf(os.Stderr... && os.Exit(1)` としているとうまく扱えなくなる。

そこで考えつくのが独自のエラー型の定義になる。

### CLI 側

main 関数に近い部分、つまりコマンドラインインターフェイスを提供する側 (user に近いレイヤ) は以下の実装をしておく。

```go
type ExitError struct {
	exitCode int
	err      error
}

func (ee *ExitError) Error() string {
	if ee.err == nil {
		return ""
	}
	return fmt.Sprintf("%v", ee.err)
}

func NewExitError(exitCode int, err error) *ExitError {
	return &ExitError{
		exitCode: exitCode,
		err:      err,
	}
}
```

error と Exit code を一緒くたに扱うための構造体を定義して、error interface を満たすために `Error()` メソッドを定義する。

Primitive な error 型はそもそも message をもっているので、メッセージについてはこれが使える。

あとは ExitError をハンドリングする関数を追加する。

```go
func HandleExit(err error) int {
	if err == nil {
		return ExitCodeOK
	}

	if exitErr, ok := err.(ExitCoder); ok {
		if err.Error() != "" {
			if _, ok := exitErr.(ErrorFormatter); ok {
				fmt.Fprintf(os.Stderr, "%+v\n", err)
			} else {
				fmt.Fprintln(os.Stderr, err)
			}
		}
		return exitErr.ExitCode()
	}

	if _, ok := err.(error); ok {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		return ExitCodeError
	}

	return ExitCodeOK
}
```

これがやっていることは、err が nil なら 0 を返し、ExitCoder (あとで全コードを載せるが ExitError が満たしているインタフェース) が実装されていればエラーを表示して、任意の Exit code で抜ける。
それでもなければ Primitive な error が実装されていればエラーを表示して非 0 で抜ける。
どれにも属さなければエラーではなく、0 で抜ける。

### 処理側

main から実行される実処理を担う部分は以下のような実装をしておく。

```go
// Result でなくてもよい
// 実装側から CLI 側に伝播させたい情報を入れた構造体を定義する
type Result struct {
	Response string

	ExitCode int
	Error    error
}
```

CLI ツールが担うメイン処理の実行を記録する構造体を定義する。
この Result は Response (`string`) を返す処理を表した構造体である。

```go
func doSomething() Result {
	// ...

	// エラーをエラーとして扱い、Exit code を非 0 とするケース
	if err != nil {
		return Result{
			Response: "no response",
			ExitCode: 1,
			Error: err,
		}
	}

	// エラーをエラーとして扱うが、Exit code は 0 でいいケース
	if err != nil {
		return Result{
			Response: "some responses",
			ExitCode: 0,
			Error: err,
		}
	}

	// Result のおかげでこの実処理を担う部分で Exit code を決めることができる
	// あとはこれが main まで正しく伝播されるように書いていく
}
```

こうすることで、先程の例に照らし合わせてみると、error と Exit code の取り回しを以下のように表すことができる。

```go
func doSomethingWrapper() (int, error) {
	result := doSomething()
	if result.Error != nil {
		return result.ExitCode, result.Error
	}
	// ...
	// cope with result.Response
}

func run(args []string) error {
	if len(args) == 0 {
		return errors.New("too few arguments")
	}
	// ...
	if err != nil {
		return err
	}
	// ...
	exitCode, err := doSomethingWrapper()
	return NewExitError(exitCode, err)
}

func main() {
	err := run(os.Args[1:])
	os.Exit(HandleExit(err))
}
```

`run()` では error を返すことに徹することができる (`run()` で error に Exit code を含めたい場合は ExitError 型に変換して抜ける)。
「Exit code を何にするか」はさらにそのさきの処理 (`doSomethingWrapper()`、実際の値を決定するのは `doSomething()`) に委ねることができている。
最終的に `main()` のレイヤで、そのエラーを咀嚼して Exit code を取り出して `os.Exit()` にわたすことができる。

## まとめ

小さいツールならこのようなことを考える必要はまったくないが、同じ CLI の中でパッケージを切り出したら、このやり方を考えても良いかも知れない。
このエラーと Exit code の取り回しは [urfave/cli](https://github.com/urfave/cli) がとても参考になった。
