---
title: "特定のワードで Twitter を監視して、検知したら Slack に投げる"
date: "2016-10-17T00:24:32+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: "http://b4b4r07.hatenadiary.com/entry/2016/10/17/205021"
tags: ["go", "twitter"]

---

... というツールを書きました。
Twitter Streaming Daemon なので [`twistd`](https://github.com/b4b4r07/twistd) です。
[最近話題の名前衝突](https://github.com/yarnpkg/yarn/issues/673)ですが、こっちは個人のツールだし一旦気にしないことにします (リポジトリ作ってから気づいた)。

{{< hatena "https://github.com/b4b4r07/twistd" >}}

## tl;dr

- Twitter Streaming API を利用してツイートを監視する
- 特定のワードで引っかかったら Slack に通知する
- 2つをいっぺんに行うコマンドを書いた (デーモンとして利用しましょう)

[![twistd](https://raw.githubusercontent.com/b4b4r07/screenshots/master/twistd/main.png)](https://github.com/b4b4r07/twistd)

*※ `['tomato', 'potato']` で引っ掛けてる例*

## モチベーション

[zplug (GitHub Organization)](http://github.com/zplug) ではオーナーの他に数名のコラボレーターの方たちがいます。
開発者同士のコミュニケーションには Slack を用い、GitHub Issues で issue トラッキングをしています。
Slack への GitHub の通知は、Slack のインテグレーション機能 (issue が作られたり P-R が投げられると通知される) を使っています。
これはよくあるスタイルだと思います。

ところが、数ヶ月 Organization を運用して気づいたのが GitHub Issues に上がってこないバグレポートや機能改善、機能要望も結構あるということです。
その多くは Twitter 上でつぶやかれていて、それからは時折 `zplug -RT` とかで Twitter 検索をしていたのですが、それを他のコラボレーターに共有するのが面倒なことと、定期的なエゴサーチが面倒 (見逃すということもある) で、Twitter を常時監視して zplug についてつぶやかれていたら Slack にポストしてくれるツールはないかと探しておりました。
ちょうど良さそうなツールはないようなので作ることにしました。

<img src="https://raw.githubusercontent.com/b4b4r07/screenshots/master/twistd/map.png" width="600">

ちなみに、zplug では twistd の他、また別の daemon や複数の bot が動いています。

<https://github.com/zplug/bots>

## 使い方とか

### インストールと設定

インストールはひとまず `git clone` して `make install` です。
詳しい利用は [`Makefile`](https://github.com/b4b4r07/twistd/blob/master/Makefile) を見てください。

```sh
$ git clone https://github.com/b4b4r07/twistd; cd twistd
$ $EDITOR config.toml    # トークンとか書く
$ sudo make install      # ビルドして /etc 以下に config 置く
```

`twist -c config.toml` で起動できます (config を指定しないと `/etc/twistd.conf` を読みに行きます)。
コマンド名は `twist` です。
末尾に `d` つかないです。

あとは自身の Twitter などで「`(検索ワード)`」を含んだツイートをすると Slack にポストされます。
もろもろは `config.toml` に設定してください。
詳しくは [README](https://github.com/b4b4r07/twistd/blob/master/README.md) で。

### デーモンとして利用する

常駐させる関係でデーモン化させておいたほうがいいでしょう。

- systemd
- supervisord
- daemontools
- ...

## 終わりに

ある国には [エシュロン](https://ja.wikipedia.org/wiki/エシュロン)という装置があるそうですが、実際に使ってみるとそれを彷彿とさせる仕上がりでした (詳しくは知らない)。
個人 (特にエンジニア) が発信するツールはブログか Twitter が大半を占めると思うのですが、Slack インテグレーションの Google Alert と、この twistd を併せて使うことで大体網羅して監視できるのが ~~気持ち悪い~~ 良いです[^1]。
...というようなエピローグはさておき、こんな感じになります。

[![twistd](https://raw.githubusercontent.com/b4b4r07/screenshots/master/twistd/demo.gif)](https://github.com/b4b4r07/twistd)

こいつは config を読み込んで常駐するだけのシンプルな作りです。
ロジックも Twitter Streaming API で待ち受けて Slack Incoming Webhooks するだけです。
よかったら使ってみてください[^2]。
改善 P-R も歓迎です。

[^1]: まあ Public なツイートのみの収集なので
[^1]: 年1回ペースでしかリリースされない新譜のチェックなどにも使えそう
