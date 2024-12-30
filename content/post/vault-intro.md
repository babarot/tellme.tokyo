---
title: "HashiCorp Vault の Unseal と Rekey"
date: "2018-08-02T19:51:52+09:00"
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: ""
image: "https://www.vaultproject.io/assets/images/og-image-7fdfa20b.png"
tags:
- hashicorp
- vault
---

## 環境

[HashiCorp Vault 0.10.4](https://github.com/hashicorp/vault/blob/master/CHANGELOG.md#0104-july-25th-2018)

## Seal/Unseal

[HashiCorp Vault](https://www.vaultproject.io/) (Vault) は起動しただけでは使えない。
Vault は _Sealed_ / _Unsealed_ という自身の状態を表すステータスの概念を持ち、これらを内部で保持する一部ステートフルなアプリケーションである。

Vault は起動時 (再起動、デプロイ後など) は _Sealed_ 状態となっており、Secret の取得や保存など、あらゆるオペレーションができないようになっている。
これはセキュリティを高めるために Vault が用意したプロセスである。

Vault では暗号化したデータを外部ストレージに保存する (Secret Backend と呼ぶ) が、復号して取り出す際に暗号化に使用したキーを必要とする。
この暗号化キーも暗号化されたデータとともに Secret Backend に保存されるが、マスターキーという別のキーで暗号化キーを暗号化している (ちなみにこのマスターキーは Secret Backend には保存されない)。
そのため、何かデータを復号して取り出すには、暗号化キーを暗号化したマスターキーが必要になる。

> ***例***
>
> 少しややこしいのでこれらを銀行に例えると、
>
> - マスターキー: 銀行という建物に入るための鍵
> - 暗号化キー: 銀行という建物の中にある保管庫の鍵
> - 秘密: 銀行という建物の中にある保管庫の中にしまってある
>
> (Vault では保管庫は銀行という建物の中にないので実際には少し違うが) 秘密を取り出すにはまず銀行の中に入るための鍵が必要で、その次に保管庫の鍵が必要になる。
> また、保管庫の鍵は銀行内にあるが銀行に入るための鍵は銀行の外にいる (複数の) 行員が持っているため、この銀行の鍵を準備する (Unseal) 必要がある。

上で説明したように、Vault でデータを取り出すためには、 _Sealed_ 状態を解除する必要があり、そのためにはマスターキーが必要になる。
Vault サーバ (クラスタ) ははじめて起動するとき (Initialize) に、マスターキーを5つのシャードに分割して Vault クライアントに提示する (Unseal Keys)。
再度、マスターキーを構築するためには3つ以上のシャードを必要とする。
これには[シャミアの秘密分散法](https://www.markupdancing.net/archive/20110912-174415.html)というアルゴリズムが用いられている。
ただし、Vault はこれらのシャードキーをどこにも保存しないので、Initialize をした者は別途保管する必要がある。

<img src="https://www.vaultproject.io/assets/images/vault-shamir-secret-sharing-7b9a3763.svg" width="400">

この仕組みのおかげで、セキュリティの向上と故障への耐性が見込める。

分割されたシャードキーを複数のデベロッパーに持たせることで、

- キーが外部に流出しても3つ以上揃えないと機密情報にはアクセスできない
- 内部にいる悪意のある利用者は自分のキーだけでは機密情報にはアクセスできない
- キーを持っている人が欠けても問題ない (休暇、退社など)

1つの強力なマスターキーを保持するときのメリット以上にデメリットを解消することができる。

Unseal (シャードキーを集めて1つのマスターキーを構築する作業) は CLI / API から行うことができる。

CLI:

```console
$ vault operator unseal
Unseal Key (will be hidden):
```

API:

```console
$ curl \
    --request POST \
    --data '{"key": "Nz1QAnTdjrlSccsPho5N7SfZr6IF0XQdYLuXzXzi/kE="}' \
    http://127.0.0.1:8200/v1/sys/unseal
```


## Rekey/Rotate

Vault サーバを最初に初期化すると、Vault はマスターキーを生成し、そしてマスターキーをシャミアの秘密分散法に従って一連のキーシェアに分割する。
Vault はマスターキーを保存しない。
そのため、マスターキーを取得するには、まだ Unseal に使われていない他のキーのクォーラム (デフォルトは3つ) で再作成する必要がある。

マスターキーは、暗号化キーを復号するために使用される。
Vault では、暗号化キーを使用してファイルシステムやデータベースのような Storage Backend のデータを暗号化する。

このようにマスターキーは非常に重要なのだが、場合によっては分割されたシャードキーを再生成したいことがあると思う。

- 誰かが組織に Join/Retire する
- シャードキーの数または閾値を変更したい
- (コンプライアンス的な問題で) マスターキーを一定の間隔で Rotate させる必要がある

など

<img src="https://www.vaultproject.io/assets/images/vault-rekey-vs-rotate-b680c62e.svg" width="400">

- Rekey: 新しいマスターキーを生成し、シャミアの秘密分散法を適用するプロセス
- Rotate: データを暗号化するために使用する暗号化キーを生成するプロセス

Rekey は以下のように実行できる。
キーシェアの数とクォーラムの閾値を入力する。
以下の例だと3つのシャードに分割し、マスターキーの構築に必要なシャードのクォーラムは2つである。

```console
$ vault operator rekey -init -key-shares=3 -key-threshold=2
Key               Value
---               -----
Nonce             dc1aec3b-ae67-5780-b4b5-2a10ca05b17c
Started           true
Rekey Progress    0/1
New Shares        3
New Threshold     2
```

上のコマンドを実行すると、Nonce が発番される。
これを使用して以下のようにオペレーションを開始する。
この Rekey には今の Unseal key が必要とされる。

```console
$ vault operator rekey -nonce=dc1aec3b-ae67-5780-b4b5-2a10ca05b17c
Rekey operation nonce: dc1aec3b-ae67-5780-b4b5-2a10ca05b17c
Key (will be hidden):
```

Rekey が完了すると新しい Unseal key が出力されシャードが3になっていることがわかる。

```console
Key 1: EDj4NZK6z5Y9rpr+TtihTulfdHvFzXtBYQk36dmBczuQ
Key 2: sCkM1i5BGGNDFk5GsqtVolWRPyd5mWn2eZG0gUySiCF7
Key 3: e5DUvDIH0cPU8Q+hh1KNVkkMc9lliliPVe9u3Fzbzv38

Operation nonce: dc1aec3b-ae67-5780-b4b5-2a10ca05b17c

Vault rekeyed with 3 keys and a key threshold of 2. Please
securely distribute the above keys. When the vault is re-sealed,
restarted, or stopped, you must provide at least 2 of these keys
to unseal it again.

Vault does not store the master key. Without at least 2 keys,
your vault will remain permanently sealed.
```

Rekey するときに現在の Unseal key を要求するのは Unseal key を持っている人しか Rekey できないことを意味する。
Rotate は Rekey とは異なり、必要な権限さえ持っていれば誰でも Rotate することができる (Policy によって定義される)。

```console
$ vault operator rotate
Key Term: 2
Installation Time: ...
```

これにより、キーリングに新しいキーが追加される。
ストレージバックエンドに書き込まれたすべての新しい値は、この新しい鍵で暗号化される。

## まとめ

Initialize -> Unseal(/Seal) -> Rekey/Rotate の流れを説明した。
マスターキーの構築 (Unseal) は Vault の初期起動のたびに発生する、つまり新しいバージョンの Vault などをデプロイしたタイミングでも発生しうる。
つまり、運用していくにあたって Unseal に付き合っていく必要がある。
また、マスターキーをどう運用するか (クォーラムをいくつに設定して誰に配布するべきか、それらをどこで管理するべきか) などを考えていく必要がある。
これは利用するエコシステム (例えば GCP なら Cloud KMS を検討するなど) やりようはいくつかある。

## 参考

https://www.vaultproject.io/docs/internals/rotation.html
https://www.vaultproject.io/docs/concepts/seal.html
https://www.vaultproject.io/guides/operations/rekeying-and-rotating.html
