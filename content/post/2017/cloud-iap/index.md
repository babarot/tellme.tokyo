---
title: "Cloud Identity-Aware Proxy を使って GCP backend を保護する"
date: "2017-10-30T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

[^1]: 今日 (2017/10/30) 現在では GCE、GAE、GKE に対応
[^2]: GKE の場合は Instance groups に属する [Nodes](https://kubernetes.io/docs/concepts/architecture/nodes/) (実体は GCE インスタンス)
[^3]: GCE の場合は Instance groups に属する GCE インスタンス
[^4]: [最近、httpstat なるものが流行っているらしい | tellme.tokyo](https://tellme.tokyo/post/2016/09/25/httpstat/)

# Cloud IAP とは

> Cloud ID-Aware Proxy（Cloud IAP）は、Google Cloud Platform で動作するクラウド アプリケーションへのアクセスを制御します。
> Cloud IAP はユーザー ID を確認し、そのユーザーがアプリケーションへのアクセスを許可されるかどうかを判断します。
> *- <https://cloud.google.com/iap/>*

![](https://cloud.google.com/images/products/iap/iap-lead.png)

つまり Cloud Identity-Aware Proxy (Cloud IAP、または IAP) を使うことで、任意の GCP リソース [^1] に存在するロードバランサに対して、許可された Google アカウントやサービスアカウントによるアクセスのみに絞ることができます。
また、このアクセスリスト (ACL) の追加や削除などは GCP のウェブコンソールから簡単に制御することができます。

# 設定方法

## GLB を作成する

IAP を使う場合、GCP 上にロードバランサ (LB) を用意する必要があります。
これは IAP が LB に対して設定されるからです。

本記事では GKE、GCE での設定方法について説明します。
現時点で GAE にも対応していますが今回は検証しません。

### 1. GKE

GKE で外部に公開したサービス (の [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)) に対して ACL を設定したい、などでしょうか。
Ingress リソースを作成すると、自動で GLBC (GCE Load-Balancer Controller) が割り当てられます。
これは、GCP のウェブコンソールからも確認できます (メニュータブから `Network services > Load balancing`)。

{{< img src="iap-gke-lb.png" width="500" >}}

あとは、GCP backend [^2] に紐付いた GLB が存在すれば IAP を有効にすることができるので、いつも通り [Service](https://kubernetes.io/docs/concepts/services-networking/service/) や [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) のリソースを作るだけで特にやることはありません。

### 2. GCE

GCE の場合も同様に IAP を設定するためのロードバランサとして GLB を用意する必要があります。
また、GCE インスタンスと GLB を紐付けるためには GCE インスタンスを Instance groups に登録する必要があります。
これは GLB がどのインスタンスグループにリクエストをバランシングするべきかを指示するために必要です。
仮に GCE インスタンスが 1 台でも、特定の Instance groups に所属させます (あとから台数を増やすことも可能です)。

GCP backend [^3] に紐付いた GLB が用意できたら、あとはコンソールから IAP を有効にするだけです。

## GLB に対して IAP を有効にする

次に、さきほど作成したロードバランサに対して IAP を有効にします。
IAP の Enabling は GCP のウェブコンソールから簡単にできます (メニュータブから `IAM & admin > Identity-Aware Proxy`)。

{{< img src="iap-console.png" width="650" >}}

画像は GKE の例です。紐付いているロードバランサが GKE で作った Ingress であることがわかります。
IAP の設定画面にはこれ以外にもたくさんの GLB が並んでいるので、IAP の認証をもたせたいサービスをバックエンドに持つロードバランサに対して、スイッチをオンにするだけで有効化できます。

有効化したあとは、以下の追加設定が必要です。
IAP を有効にすると次のような Credentials が作成されています。

{{< img src="iap-cred.png" width="650" >}}

これはその IAP に対する Client ID や Secret を表します。
最後に Authorized redirects URIs を設定する必要があります。
これは `https://<YOUR_APP_URL>/_gcp_gatekeeper/authenticate` の形で設定する必要があります。

詳しくは <https://cloud.google.com/iap/docs/how-to> をご覧ください。

数分で IAP が設定されるので、完了したらアクセスしてみてください。

# IAP-protected app にリクエストする

## ブラウザから

設定が完了していると、ロードバランサがつなぐサービスの URL にアクセスすると IAP によって Google の認証・認可が入ります。

{{< img src="iap-browser.png" width="500" >}}

ブラウザからだと Google アカウントによる認証になるので、IAP のコンソールから ACL にそのアカウントを追加するとログインすることができます。

{{< img src="iap-acl.png" width="500" >}}

ACL にないアカウントや、ID/Pass が異なる場合などはログインできず、バックエンドサービスへリクエストはいきません。

{{< img src="iap-failed.png" width="500" >}}

## プログラムから

ユーザがブラウザからアクセスするような Web アプリケーションなどの場合であれば問題ないのですが、API だけを提供するような GCP backend のサービスであったり開発中だったりすると、`curl` といった馴染みの CLI ツールやプログラムから認証したいことが多いと思います。
また、IAP による認証だけを提供するためのバックエンド (つまり IAP プロキシ) であれば、この必要性は更に高いです。
そのためコードベースでアクセスできるようにしておくとよいでしょう。

まず、OpenID Connect (OIDC) トークンを使用して、Cloud IAP で保護されたリソースに対してサービスアカウントを認証します。 - *<https://cloud.google.com/iap/docs/authentication-howto>*

1. Cloud IAP で保護されたプロジェクトのアクセスリストにサービスアカウントを追加します
2. JWT ベースのアクセス トークン (JWT-bAT) を生成します
3. Cloud IAP で保護されたクライアント ID の OIDC トークンをリクエストします
4. `Authorization: Bearer` ヘッダーに OIDC トークンを追加して、Cloud IAP で保護されたリソースへの認証済みリクエストを作成します

本記事では簡単に `curl` を使ってリクエストするフローだけ説明します。

まず、GCP の Credentials から Other タイプで機密情報を作成します。

```bash
OTHER_CLIENT_ID="324403170728-gt3eoa75t6acdto8higo2opr18m8b6bd.apps.googleusercontent.com"
open "https://accounts.google.com/o/oauth2/v2/auth?client_id=$OTHER_CLIENT_ID&response_type=code&scope=openid%20email&access_type=offline&redirect_uri=urn:ietf:wg:oauth:2.0:oob"
```

上記 URL を開くと認証コードを取得できます。

{{< img src="iap-auth-code.png" width="500" >}}

これが `AUTH_CODE` になります。

```bash
OTHER_CLIENT_ID="324403170728-gt3eoa75t6acdto8higo2opr18m8b6bd.apps.googleusercontent.com"
OTHER_CLIENT_SECRET="6wRMEKNTpHCJA4jz3M4v0O-P"
AUTH_CODE="4/OQcxiB3JZo8rTIPOmlRNo1m9q2V9CQY6Y343BFWlYLU"

REFRESH_TOKEN=$(
curl --verbose \
    --data client_id=$OTHER_CLIENT_ID \
    --data client_secret=$OTHER_CLIENT_SECRET \
    --data code=$AUTH_CODE \
    --data redirect_uri=urn:ietf:wg:oauth:2.0:oob \
    --data grant_type=authorization_code \
    https://www.googleapis.com/oauth2/v4/token
)
```

上記スクリプトを使用して `REFRESH_TOKEN` を取得します。

```bash
REFRESH_TOKEN="1/2NR2PjGdKnIOw5oYacdOt7EszfkgB_MEEuOMpcLzzd4TdDtqiCUH__GEMQX20nji"

token=$(
curl --verbose \
    --data client_id=$OTHER_CLIENT_ID \
    --data client_secret=$OTHER_CLIENT_SECRET \
    --data refresh_token=$REFRESH_TOKEN \
    --data grant_type=refresh_token \
    --data audience=$IAP_CLIENT_ID \
    https://www.googleapis.com/oauth2/v4/token | jq -r .id_token
)

curl \
    -H "Authorization: Bearer $token" \
    "https://myserver.tellme.tokyo"
```

取得した `REFRESH_TOKEN` を元にトークンを生成し、Bearer につけてバックエンドサービスにリクエストします。
これでようやく IAP で保護されたアプリケーションにリクエストすることができました。

サービスアカウントを使うことでよりプログラマブルなリクエストが可能です。
Go や Python、PHP といった各種言語での具体例については以下のリポジトリにサンプルスクリプトをまとめました。
詳しくはリポジトリにある README を参考にしてください。

{{< hatena "https://github.com/b4b4r07/make_iap_request" >}}

また、上述した `curl` 流れを簡単にするために Client ID とサービスアカウントを使ってリクエストを作ることができる CLI の curl ラッパーを書きました。
こちらも参考にしてみてください。

{{< hatena "https://github.com/b4b4r07/iap_curl" >}}

こんな感じでリクエストすることができます。
Client ID (`IAP_CLIENT_ID`) は IAP に紐付いている Credentials から、サービスアカウント (`GOOGLE_APPLICATION_CREDENTIALS`) はどの GCP プロジェクトでもいいのでメニュータブから作成した後に IAP のコンソールのアクセスリストにそのメールアドレスを追加してください。

```bash
IAP_CLIENT_ID="342624545358-asdfd8fas9df8sd7ga0sdguadfpvqp69.apps.googleusercontent.com"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
iap_curl "https://myserver.your-iap-protected-app.com"
```

内部で実行するコマンドは `curl` ですが、`httpstat` [^4] を使ってベンチマークを取ることも可能です。

```bash
IAP_CURL_BIN="httpstat"
iap_curl "https://myserver.your-iap-protected-app.com"
```

# IAP の仕組み

最後に IAP がどのように実装されているのか説明します。

※ 出典は <https://cloud.google.com/iap/docs/how-to> です。詳しくはそちらを参照してください。

Cloud IAP によって保護されているアプリケーションまたはリソースには、適切な [Cloud Identity Access Management (Cloud IAM) 役割](https://cloud.google.com/iam/docs/understanding-roles)を持つユーザーとグループがプロキシ経由でのみアクセスできます。
Cloud IAP によってアプリケーションまたはリソースへのアクセスをユーザーに許可すると、使用中のサービスによって実装されたきめ細かいアクセス制御が適用され、VPN を使用する必要がなくなります。
ユーザーが Cloud IAP で保護されたリソースにアクセスしようとすると、Cloud IAP が認証と承認のチェックを行います。

## 認証

Google Cloud Platform (GCP) リソースへのリクエストは、App Engine または Cloud Load Balancing（HTTPS）経由で送信されます。
これらのサービスの処理インフラストラクチャコードは、Cloud IAP がアプリまたはバックエンド サービスに対して有効になっているかどうかを確認します。
Cloud IAP が有効になっている場合は、保護されたリソースに関する情報が Cloud IAP 認証サーバーに送信されます。
これには、GCP プロジェクト番号、リクエスト URL、およびリクエスト ヘッダーや Cookie 内の Cloud IAP 認証情報などの情報が含まれます。

次に、Cloud IAP はユーザーのブラウザ認証情報をチェックします。
存在しない場合、ユーザーは OAuth 2.0 の Google アカウントログインフローにリダイレクトされ、トークンが今後のログインのためにブラウザの Cookie に保存されます。
既存のユーザー用の Google アカウントを作成する必要がある場合は、Google Cloud Directory Sync を使用して Active Directory または LDAP サーバーと同期できます。

リクエストされた認証情報が有効である場合、認証サーバーはこれらの認証情報を使用してユーザーの ID (メールアドレスとユーザー ID) を取得します。
認証サーバーは、この ID を使用してユーザーの Cloud IAM 役割をチェックし、ユーザーがリソースにアクセスする権限を持っているどうかをチェックします。

Compute Engine または Container Engine を使用している場合、仮想マシン (VM) のアプリケーション処理ポートにアクセスできるユーザーは Cloud IAP 認証をバイパスできます。
Compute Engine と Container Engine のファイアウォールは、同じネットワーク上の他の VM や Cloud IAP で保護されたアプリケーションと同じ VM 上で実行されているコードからのアクセスを防御しません。

## 承認

認証後、Cloud IAP は関連する Cloud IAM ポリシーを適用して、ユーザーが要求されたリソースにアクセスする権限を持っているかどうかをチェックします。
リソースが存在する Cloud Platform Console プロジェクトで Cloud IAP の access: HTTPS 役割を持つユーザーは、アプリケーションにアクセスする権限があります。
Cloud IAP の access: HTTPS 役割リストを管理するには、Cloud Platform Console の Cloud IAP パネルを使用します。

# 今後の課題

## IAP の設定は各 LB ごとにできるが、ACL はプロジェクト内で共通

IAP の設定画面には、そのプロジェクトで作成されたロードバランサのすべてが並んでいます。
Cloud IAP ではその LB のそれぞれに対して IAP を有効にするかどうか選択できます。
しかしアクセスリストの一覧はその GCP プロジェクト内でひとつしか設定できません。

つまり、例えるならば「エディター」という GCP プロジェクトにある「最近の Emacs ニュースを提供するサービス」と「最近の Vim ニュースを提供するサービス」の ACL を分けることができないのです。
これはセキュリティ上、好ましくありません。

## IAP の ACL への追加が手動

開発者や関係者がたくさんいる場合、たくさんの Google アカウントを手動で ACL に追加しなければなりません。
とはいえ、Google グループを使ってグルーピングすることが可能なので、多少のオペレーションで済みますが、Terraform などを使ったコードベースの管理はまだできないようです。

# まとめ

- Cloud IAP を使うと GCP にあるサーバに対して簡単に Google 認証を設定できます
- リクエストするにはサービスアカウントと JWT 認証による手続きが必要です
- 簡単にリクエストを作るために `iap_curl` という CLI ツールを書きました

# 参考資料

- [Google Cloud Identity-Aware Proxy(Cloud IAP)でWebアプリに認証を追加する | :wq](https://takipone.com/gcp-cloud-iap-ataglance/)
- [Google Cloud Platform Japan 公式ブログ: Cloud Identity-Aware Proxy におけるアクセス制御の仕組み](https://cloudplatform-jp.googleblog.com/2017/05/Getting-started-with-Cloud-Identity-Aware-Proxy.html)
- [Google Cloud IAP and GKE – Daz Wilkin – Medium](https://medium.com/@DazWilkin/google-cloud-iap-and-gke-c773da56c3cf)
- [python-docs-samples/iap at master - GoogleCloudPlatform/python-docs-samples](https://github.com/GoogleCloudPlatform/python-docs-samples/tree/master/iap)
- [Implement IAP/JWT client - Issue #149 - google/google-auth-library-php](https://github.com/google/google-auth-library-php/issues/149)
- [Connecting to IAP (Identity Aware Proxy) protected service with PHP and Service Account - Stack Overflow](https://stackoverflow.com/questions/43995763/connecting-to-iap-identity-aware-proxy-protected-service-with-php-and-service)
- [imkira/gcp-iap-auth: A simple server implementation and package in Go for helping you secure your web apps running on GCP behind a Cloud IAP (Identity-Aware Proxy)](https://github.com/imkira/gcp-iap-auth)
