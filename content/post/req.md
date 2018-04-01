---
title: "複数のサービスのヘルスチェックをとるツール"
date: "2018-04-01T23:05:54+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["golang", "http"]

---

## ヘルスチェックのときの問題点

あるウェブサービスの動作確認をとっているとき、curl などを使ってリクエストを送ると思いますが、場合によっては環境変数が必要だったり、エンドポイントのパスが長かったり、[Cloud IAP](https://cloud.google.com/iap/) といった認証機構があったりします。
動作確認中はだいたい複数回実行するので実行しやすいように（また履歴で追いやすいように）、書き捨て用のシェルスクリプトにまとめたり、再利用しやすいようにワンライナーにしたりします。

```bash
#!/bin/bash
GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-credentials.json"
CLIENT_ID="sample.apps.googleusercontent.com"
curl "https://iap-protected-app-url"
```

（再利用性が高く変数をスクリプト内のプロセスに閉じられる上に編集はしやすいが、毎回このようなシェルスクリプトを書くのは面倒）

```bash
$ GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-credentials.json" CLIENT_ID="sample.apps.googleusercontent.com" curl "https://iap-protected-app-url"
```
（再利用性も高く変数はコマンドのプロセスにしか影響しないが、長くて見づらく編集しづらい）

環境変数を含むワンライナーだとあまりにも長いので、以下のように環境変数の宣言部分だけコマンドラインから先に実行してしまえば curl と URL のみの実行で済みますが、特定のエンドポイント用の環境変数が実行シェルに記録されてしまうのは好ましくありません。

```bash
# 記録される
$ GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-credentials.json"
$ CLIENT_ID="sample.apps.googleusercontent.com"

$ curl "https://iap-protected-app-url"
```

（変数部分だけコマンドラインから定義してしまえば curl からの実行で済むが、シェルを再起動するまでは変数が実行プロセスに記録されてしまう）

問題はこれだけではありません。
開発環境の動作確認が終わったら本番環境の動作確認です（critical なサービスではない場合、初動の動作確認はカジュアルに curl でヘルスチェックを取ることも多いです）。

今度は本番環境に変わるのでURLや環境変数を書き換える必要があります。
また、開発環境と本番環境のヘルスチェックの行き来をしなきゃいけない場合もあります。
流石にここまでくると面倒くさくて、確認が終わったら削除するであろう取り急ぎなスクリプトにしちゃうことが多いです。

## あとからまたヘルスチェックをとりたいと思ったとき

これまでは上記の方法でなんとかお茶を濁していたのですが、最近厳しくなってきました。
見ているサービスが多くなってきたためです。

例えばあるサービスの Dev の様子がおかしいとなったとき、開発者が修正をデプロイしたとしても、場合によっては SRE や基盤チームがその後の疎通やサービスの状態をみたりします。
上にあるようなその場しのぎのスクリプトやワンライナーでやっていると、すでにスクリプトを削除していたり履歴を追うのが面倒で、こういうときにヘルスチェック用のパスが何だったのか（`/health` ? `/status` ?）、そもそもリクエストすべきサービスの URL がなんだったのか正確に思い出せません。

## ツール

<https://github.com/b4b4r07/req>

前に Cloud IAP で保護されたエンドポイントに対して簡単にリクエストを送るために作った CLI ツールの [iap_curl](https://github.com/b4b4r07/iap_curl) が便利だったので、基本的な挙動はそのままに少し手を加えて汎用化しました。

[Cloud Identity-Aware Proxy を使って GCP backend を保護する | tellme.tokyo](https://tellme.tokyo/post/2017/10/30/cloud-iap/)

以前より機能を追加したので、IAP かどうかに関わらず複数のエンドポイントに対して Configurable なリクエストの作成が可能になりました。

### インストール

```bash
$ go get github.com/b4b4r07/req
```

### 設定

基本的に環境変数や各種エンドポイントのパスやその設定などは req 用の設定ファイルに書きます。
初回は勝手に雛形を作成するので、以下のように起動します。

```bash
$ req --edit-config
```

適当に書き換えます。

```json
{
  "default_request_command": "curl",
  "services": [
    {
      "url": "https://iap-protected-app-url",
      "command": "curl",
      "use_iap": true,
      "env": {
        "CLIENT_ID": "sample.apps.googleusercontent.com",
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/google-credentials.json"
      },
      "processes": [
        "jq ."
      ]
    }
  ]
}
```

- `default_request_command`: リクエストに使うコマンド。それぞれは `services.command` で変更できる
- `services`: 各種サービスについて
    - `url`: エンドポイント
    - `command`: 使うコマンド。`ab`、`httpstat` など個別に設定できる
    - `use_iap`: Cloud IAP で保護されている場合
    - `env`: 任意の環境変数
    - `processes`: `command` の結果を加工できる。リストの要素間はパイプで繋がれる

いまのところ JSON ですが、書きづらいので TOML あたりにするかもしれません。

### 使い方

```bash
$ req "https://iap-protected-app-url"
```

reqに渡したエンドポイントが設定ファイルの `services.url` にある URL だった場合、その設定を使用してリクエストされます。
上のサンプルの JSON 場合だと、Cloud IAP 経由でかつ、その際に必要な環境変数 `CLIENT_ID` などが渡されてリクエストされます。

`req --list-urls` で URL を列挙することができるので、peco や fzf で選択して req に渡すと今っぽくて楽です。

```bash
$ req $(req --list-urls | peco)
```

レスポンスが JSON で返ってくると分かっている場合は、`services.processes` に jq を設定しておくと勝手に req 側でパイプで繋ぎます。

また、基本的に req は curl 互換として動作します。
そのため、curlのオプションなどを使用できます。

```bash
$ req --user USER:PASSWORD "https://iap-protected-app-url"
```

`services.command` などで httpstat などを選択していれば、httpstat 互換となり httpstat のオプションを受け付けます。
httpstat についてはこちら。

[最近、httpstat なるものが流行っているらしい | tellme.tokyo](https://tellme.tokyo/post/2016/09/25/httpstat/)

curl 互換（`default_request_command` 互換、`services.command` 互換）として動作すると説明しましたが、そもそも req はエンドポイントとそれに対する設定が一緒に管理できるというだけで、基本的にはただの curl ラッパーなので、設定ファイルにないエンドポイントに対してもリクエストできます。
通常のcurlに変わりありません。

```bash
$ req "https://api.github.com"
```

また、curl 互換として動く場合、`.curlrc` を参照します。

### カスタマイズ

`req $(req --list-urls | peco)` からちょっといじって関数にしました。
これを .bashrc や .zshrc に書くともう少し便利になります。

```bash
function req() {
    if [[ -n $1 ]]; then
        command req "$@"
        return $?
    fi
    command req $(command req --list-urls | fzf --height 20 --reverse)
}
```

コマンドラインから req とタイプすると関数定義された req が実行され、引数があるときはコマンドのほうの req に引数を渡して実行し、引数がないときは fzf による URL の選択画面を呼び出します。
コマンドの req を上書きしたようなイメージです。

## まとめ

- req はエンドポイントと環境変数などの設定をひとまとめに管理できる
- 今までどおり curl を使っていたところを req に変えて動く
