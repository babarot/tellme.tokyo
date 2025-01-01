---
title: "ログのタイムスタンプで UNIX 時間なのはツライって話"
date: 2016-12-06T21:12:26+09:00
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2016/12/06/211226"
tags:
- go
---

## tl;dr

https://github.com/b4b4r07/epoch-cat

- UNIX 時間は読めないのでログファイル丸ごと食わせて、該当部分を変換するフィルタ作った

## やり方は色々ある

JSON とか LTSV とか combine とか、それらの複合で記録されてることの多いログファイルですが、たまにタイムスタンプが [UNIX 時間](https://ja.wikipedia.org/wiki/UNIX時間)になってることがあります。

これめっちゃつらくないですかね？...とても普通の人間が読める形式じゃないです。素の JSON であれば、[jq](https://stedolan.github.io/jq/) に食わせて [Dates 系の関数](https://stedolan.github.io/jq/manual/v1.5/#Builtinoperatorsandfunctions) などで加工することは可能ですが、jq 1.5 以上((現在 2016/12/06 最新の安定版は v1.5))が必須で、かつ jq 構文を覚えたり都度調べる必要があります (jq は好きだけどあまり使わない構文を覚えるのは個人的に面倒)。

そもそもログファイルが JSON じゃない形式の場合は、以下のリンクにあるようなやり方を組み合わせて調べたり、もはや UNIX 時間になっている該当部分をコピペして date コマンドに投げたりして JST (や UTC) に変換することが多いです。

{{< hatena "https://ponkotuy.hatenadiary.org/entry/20140827/1409127514" >}}

```bash
$ date -d @1478745332.2113 +"%Y/%m/%d %T" # GNU date
```

これ非常に面倒なんですよね。さらに言えば GNU date である必要があったり(([GNU date コマンドで unix time 変換](http://qiita.com/albatross/items/b97df73dcfcedabb070d)))して、ただログの時間を読みたいだけなのに無駄に考えることが多いです。

## こまけぇこたぁいいから

時と場合であれこれ考えずに丸っとよしなにやってくれるフィルタあったら便利そう、ってことで書いてみました。

- <https://github.com/b4b4r07/epoch-cat>

別に難しいことはしてなく、cat コマンドの要領で UNIX 時間っぽい数字を [RFC3339 形式](https://www.ietf.org/rfc/rfc3339.txt)に変換します。数値を何でもかんでも変換していたらとてもやってやれないので、誤爆を防ぐために `2000-01-01 00:00:00+00:00` 以降の UNIX 時間 (946684800) にのみ反応します。ロケールは TZ 環境変数に従ってローカライズされます。

それでも誤爆する場合 (例えば、9桁以上のユーザ ID が頻繁に登場するなど) は、`-p` オプションで検索用のプレフィックスをつければ良いです。

```bash
$ cat error_log | epoch-cat -p '"time":' -q | jq .
{
  "time": "2016-12-05T21:51:26Z",
  "user_id": 987654321,
  "level": "WARNING",
  "error": {
    "message": "見つかりませんでした",
    ...
```

どんな形式でも一旦このフィルタ噛ませばヒューマンリーダブルな時刻形式に変わってくれるので捗ります。

## まとめ

個人的に、ツールとしてはこんなんでいいんですよ。ログ漁ってるときはあれ探してみてこれ探してみて、とあれこれ考えてること多いので無駄なことは考えたくないなぁという話でした。
