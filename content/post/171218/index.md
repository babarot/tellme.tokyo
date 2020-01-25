---
title: "書くのが面倒な zsh 補完関数を簡単に生成するツール「zgencomp」つくった"
date: 2015-03-24T17:12:18+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/03/24/171218"
tags:
- go
- zsh
---

[b4b4r07/zgencomp・GitHub](https://github.com/b4b4r07/zgencomp)

`zgencomp` を使えば、Zsh コマンドの補完関数を簡単に生成することができます。

## 背景

Zsh の醍醐味のひとつが補完機能であるのは言わずもがなですね。

この補完について、基本的なコマンドや有名プロジェクトのコマンドなどの多くは提供されているのですが、自作コマンドもちろんのこと、マイナーなコマンドは提供されていなかったりします。

その場合、ユーザが Zsh スクリプトの記法で補完ファイルを記述しなければなりません。これが結構骨の折れる作業で、Zsh が提供する補完インターフェースは高機能ゆえに複雑怪奇で、並みのユーザはおろか熟練のシェルスクリプターでも投げ出したくなる様です。

特に自作コマンドの場合、コマンドの作成で疲弊して、マニュアルやドキュメンテーションでも疲弊しているところにこの補完機能の作業となると、まず補完は諦めがちです。

## zgencomp を使う

そこでこのツールです。

まずはデモを。

[![zgencomp](https://raw.githubusercontent.com/b4b4r07/zgencomp/master/data/zgencomp.gif)](https://github.com/b4b4r07/zgencomp "b4b4r07/zgencomp・GitHub")

JSON ファイルに設定を記述し、それをもとに補完関数を生成します。JSON ファイルはある程度のテンプレートが用意されているので書き換える形で簡単に設定できます。

## JSON ファイルの書き方

### "command"

サンプルである [JSON ファイル](https://raw.githubusercontent.com/b4b4r07/zgencomp/master/data/templates/sample.json)の書き換え方について紹介します。

```json
{
    "command" : "mycmd",

    "properties" : {
        "author" : "John Doe",
        "license" : "MIT",

```

ここらへんはそのままですね。ただし、`"command"` が空白の場合、パースエラーになります。

### "properties"

```json
        "help" : {
            "option" : [
                "-h",
                "--help"
            ],
            "description" : "show this help and exit"
        },
```

ヘルプやバージョンに関するオプションについては通常のオプションとしては扱わず、コマンドの属性情報（`"properties"`）として処理します。

また、`"option"` について指定できるオプションは `-` または `--` から始まる文字列です（ショート／ロング オプション）。加えて、1つ以上のオプション指定が必須です。1つも指定されていない場合は、補完が実行されません。
これは `"help"` の `"option"` だけではなくすべての `"option"` に当てはまります。

`"description"` は補完されるときに説明として表示されるものです。空欄でもパースエラーにはなりませんが、他にも空欄のコマンドがあるとうまく補完されないので注意です。

### "options"

`"options"` は `"switch"` と `"flag"` から成ります。前者は引数を取らず、後者はオプション引数を要求します。
（`"options"` と `"option"` は似ているので注意が必要です。前者はフラグをスイッチの総称で、後者は実際のオプション文字列自体を指します）

#### "switch"

```json
    "options" : {
        "switch" : [
            {
                "option" : [
                    "-i",
                    "--interactive"
                ],
                "description" : "show with plain text",
                "exclusion" : [
                    "-f",
                    "--force"
                ]
            }
        ],
```

`"option"` や `"description"` はヘルプなどのそれとほぼ変わりません。

`"exclusion"` とはオプションの排他制御です。一般的に、コマンドのオプションには同時に指定しても無意味な組み合わせがあります。例えば、`ssh` の `-4`、`-6` オプションはそれぞれ `IPv4`、`IPv6` で明示的に接続するためのものですが、両方指定するのは無意味です。そのときに、補完候補から取り除いてくれる設定がこの `"exclusion"` です。

#### "flag"

```json
        "flag" : [
            {
                "option" : [
                    "-A",
                    "--after-context"
                ],
                "description" : "Print num lines of trailing context after each match",
                "exclusion" : [
                ],
                "argument" : {
                    "group" : "",
                    "type" : "files",
                    "style" : {
                            "standard" : ["-A"],
                            "touch" : [],
                            "touchable" : [],
                            "equal" : ["--after-context"],
                            "equalable" : []
                    }
                }
            },
```

これは引数を取るオプションです。先程よりも少し複雑化します。

`"option"`、`"description"`、`"exclusion"` までは同じです。`"argument"` は このフラグオプションが引数として取る文字列についての詳細な設定項目です。

- `"group"` は補完のさいにグルーピングされる時の文字列です。

	[f:id:b4b4r07:20150324171210p:plain]

- `"type"` は実際に補完されるワードについてです。

	"file" を指定した場合、ファイルについて補完されます。
	"dir"、"directory" はディレクトリ補完です。
	"func" はカスタムタイプです。複雑な条件のもと補完ワードを選出する場合に利用します。別途、補完ワードを返す関数などを記述する必要があります。
	補完ワードが決まりきっている場合（例："foo" と "bar" だけ、など）は補完ワードをベタ書き可能です。そのときは array タイプで記述します。
	
    ```json
    "type" : [
        "init",
        "add",
        "commit"
    ],
    ```

	また、補完ワードに説明を付与したい場合は以下のように記述できます。
	
	```json
	"type" : {
		"init" : "Create an empty Git repository or reinitialize an existing one",
		"add" : "Add file contents to the index",
		"commit" : "Record changes to the repository"
	}
	```
	
	結果：
	[f:id:b4b4r07:20150324171135p:plain]
	
- 最後に `"style"` についてです。

	これはオプションの引数の取り方（スタイル）を定義します。`--output=a.txt` というようなオプション指定にあるイコールなどです。
	
	| スタイル名 | スタイルの様子 |
	|:---:|:---|
	| **standard** | `-opt VAL` |
	| **touch** | `-optVAL`|
	| **touchable** | `-optVAL` or `-opt VAL` |
	| **equal** | `opt=VAL` |
	| **equalable** | `-opt=VAL` or `-opt VAL` |
	
	オプションはいずれかのスタイルに所属します。何も指定されないオプションは "standard" として扱われます。また、一つのオプションが複数のスタイルに所属する場合、最初に指定したスタイルが適応されます。

### "arguments"

```json
    "arguments" : {
        "always" : true,
        "type" : "func"
    }
}
```

## 使い方

```bash
$ zgencomp -g
```

サンプルの JSON ファイルを生成します。

そして、[JSON ファイルの書き方]()を参考にして自分のコマンドのUIに合うように書き換えてください。

そして、

```bash
$ zgencomp
```

で補完関数が標準出力に出されます。`zgencomp some.json` にように引数を取って指名しても構いません。上のように省略された場合はカレントディレクトリにある `sample.json`（`zgencomp -g` に呼応）を読みに行きます。

## インストール

Go 言語の環境を要求します。近いうち、というかバージョン1.0にしたときに Releases にバイナリをアップロードする予定です。

```bash
$ go get github.com/b4b4r07/zgencomp
$ cd $GOPATH/src/github.com/b4b4r07/zgencomp
$ make install
```

## 最後に

結構便利にサクッと補完関数が生成されます。使ってみてください。

### 備考

まだまだアルファ版です（バージョン0.2）。非互換なバージョンアップは避けるつもりですが、急に JSON のフォーマットなどが変更される場合があります。
