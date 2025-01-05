---
title: "ブログをGKEで運用し、Spinnakerでデプロイする"
date: "2017-07-30T12:37:33+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: ""
tags: ["kubernetes", "spinnaker", "GKE"]

---

{{< img src="kubernetes.png" width="200" >}}

このブログを[はてなブログ](http://b4b4r07.hatenadiary.com/)から [Google Container Engine](https://cloud.google.com/container-engine/) (GKE) に移行しました。

今回、移行先に GKE を選択した理由は GKE を使ってみたかったからです。ある Web サービスを GKE に移行することになったのですが、今まで [Kubernetes](https://kubernetes.io/) を含め触ったことがなかったので、自分の持つサービスで練習がてらと思いブログを題材にしました。

**目次**

- 移行のためにやったこと
	- ブログ用の Docker コンテナを作成
	- kubernetes cluster を構築
	- コンテナの入った Pod を動かす
	- HTTPS 化する
- 記事の配信まで
	- Circle CI による継続的インテグレーション
	- Spinnaker による継続的デリバリ
- 所感など

## 移行のためにやったこと

今回の移行に際し、移行周りのスクリプトや kubernetes のマニフェストファイル、及び記事自体を管理するために GitHub にリポジトリを作りました。

{{< hatena "https://github.com/b4b4r07/tellme.tokyo" >}}

### 1. ブログ用の Docker コンテナを作成

まずはブログを配信するためのサーバを載せたコンテナを作成します。静的サイトジェネレーターには [Hugo](https://gohugo.io/) を利用しました。

```dockerfile
FROM golang:1.8-alpine AS hugo
RUN apk add --update --no-cache git && \
    go get -v github.com/spf13/hugo && \
    apk del --purge git
COPY . /app
WORKDIR /app
RUN hugo

FROM nginx:alpine AS nginx
COPY --from=hugo /app/public /usr/share/nginx/html
```

hugo コンテナ側で生成した記事一式が入った public ディレクトリを Nginx コンテナで配信する Dockerfile です ([multi-stage builds](https://docs.docker.com/engine/userguide/eng-image/multistage-build/#before-multi-stage-builds))。

参考:

- [Docker マルチステージビルドで幸せコンテナライフ / Understanding docker's multi-stage builds // Speaker Deck](https://speakerdeck.com/toricls/understanding-dockers-multi-stage-builds)
- [Docker multi stage buildで変わるDockerfileの常識 - Qiita](http://qiita.com/minamijoyo/items/711704e85b45ff5d6405)



Docker のレジストラには [Docker Hub](https://hub.docker.com/) を利用しました。料金的に [Google Container Registry](https://cloud.google.com/container-registry/) を使っても安そうなのでいいかもしれません。

```console
$ docker build -t b4b4r07/tellme.tokyo .
$ docker push b4b4r07/tellme.tokyo
```

### 2. kubernetes cluster を構築

Google Cloud Platform (GCP) の Web コンソールからプロジェクトを作成し、kubernetes cluster を作成しました。cluster の作成もコンソールからもできますが、以下のように `gcloud` コマンドからもできます。

```bash
#!/bin/bash
PROJECT_ID="tellme-tokyo"
ZONE="asia-east1-b"
CLUSTER="culster-1"
gcloud alpha container clusters create ${CLUSTER} \
       --project="${PROJECT_ID}" \
       --zone="${ZONE}" \
       --machine-type=n1-standard-8 \
       --enable-autoscaling \
       --max-nodes=20 \
       --min-nodes=1 \
       --enable-cloud-logging \
       --enable-cloud-monitoring
```

### 3. コンテナの入った Pod を動かす

Docker Hub からイメージを取得して Service を構成します。Pod は Deployment で撒きます。

[*kubernetes/deployment.yaml*](https://github.com/b4b4r07/tellme.tokyo/blob/master/kubernetes/deployment.yaml)

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: blog
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: blog
    spec:
      containers:
      - image: b4b4r07/tellme.tokyo
        name: blog
        ports:
        - containerPort: 80
```

Service は Ingress でロードバランサをつくるために [NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport) を指定していますが、証明書やドメインをあてるまえにデバッグする場合には [LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#type-loadbalancer) を指定するのがいいと思います。

SSL ターミネートは [kube-lego](https://github.com/jetstack/kube-lego) というパッケージを用いるため、blog コンテナでは 80 番ポートを受け付けます。

[*kubernetes/service.yaml*](https://github.com/b4b4r07/tellme.tokyo/blob/master/kubernetes/service.yaml)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: blog
spec:
  ports:
  - name: http
    port: 80
    targetPort: 80
  selector:
    app: blog
  type: NodePort
```

### 4. HTTPS 化する

kube-lego を使うと、Let's Encrypt からの証明書の取得の自動化を行い、サービスの HTTPS / HTTP2 対応が簡単にできます。

参考: [GKE でサービスを HTTPS と HTTP/2 に対応する(kube-lego 編) - Qiita](http://qiita.com/apstndb/items/2fef0a80d4510516cb1f)

今回は [Helm](https://helm.sh/) という kubernetes のパッケージマネージャを使ってインストールします。

[charts/stable/kube-lego at master · kubernetes/charts](https://github.com/kubernetes/charts/tree/master/stable/kube-lego)

これを用いることで kube-lego のマニフェストファイルの管理については、自分で行う必要がなくなり、またマニフェストの一部の変更 (例えば email を自分のものに差し替えたりなど) をコード化することができます。

```console
$ helm init
$ helm install stable/kube-lego -n lego -f kubernetes/lego.yaml
```

`helm` に指定する `-n` ネームスペースは任意のものを (与えないと自動でジェネレートした文字列があてがわれる)、`-f` ファイルは自分の設定を書いたものを与えます。

```console
$ helm list
NAME            REVISION        UPDATED                         STATUS          CHART                   NAMESPACE
lego      1               Fri Jul 28 15:28:06 2017        DEPLOYED        kube-lego-0.1.10        default
```

これにて、GCE Load Balancer の health check が通れば HTTPS 化されたサイトが公開されるはずです。

## 記事の配信まで

記事を書いてから配信するまでの手順が多いとブログを書く気になりません。それでは本末転倒なのでイメージの作成等を簡単にしておきたいです。

今回は Circle CI を使ってイメージのビルドと Docker Hub に Push までを自動化することにしました。こうすることで、記事を書いて `git push` をするだけで新しいイメージに置き換わります。

Docker Hub に上がった新しいイメージで Pod を作り直す部分については、[Spinnaker](https://www.spinnaker.io/) でデプロイさせるようにしました。

{{< img src="cicd.png" width="600" >}}

### Circle CI による継続的インテグレーション

`git push` をトリガーに動いてくれるのでイメージの作成にうってつけです。やりたいこと的には [Google Cloud Container Builder](https://cloud.google.com/container-builder/docs/) を使っても良かったと思います。

ちょっと面倒なことに、Circle CI で使われる Docker イメージでは docker のバージョンが古く、multi-stage builds (v17.05~) が利用できませんでした。Docker コンテナの中で docker のバージョンを上げることも考えたのですが、config.yml が長くなることなどを考えると Dockerfile を分けたほうが安上がりだと思い、Circle CI 用に分割した Dockerfile も push してあります。

参考: [CircleCI2.0でRailsアプリをdocker multi stage buildをする - あすたぴのブログ](http://astap.hatenablog.jp/entry/2017/06/11/184611)



[*.circleci/config.yml*](https://github.com/b4b4r07/tellme.tokyo/blob/master/.circleci/config.yml)

```yaml
...
      - run:
          name: Build docker image and push to Docker Hub
          command: |
            cp -f scripts/Dockerfile-hugo .
            cp -f scripts/Dockerfile .
            docker build -t b4b4r07/tellme.tokyo:hugo -f Dockerfile-hugo .
            docker cp $(docker run -d b4b4r07/tellme.tokyo:hugo):/app/public .
            docker build -t b4b4r07/tellme.tokyo .
            docker tag b4b4r07/tellme.tokyo b4b4r07/tellme.tokyo:latest
            docker login -u $DOCKER_USER -p $DOCKER_PASS
            docker push b4b4r07/tellme.tokyo:latest
...
```

上にある通り、初回のイメージ作成では不要だったファイルコピーと `docker cp` が発生しているのはそのためです。

### Spinnaker による継続的デリバリ

Spinnaker を使って Docker Hub への Push をトリガーに Pod に再配布していきます。

Spinnaker とは Netflix がメインとなって開発したオープンソースの継続的デリバリ (Continuous Delivery; CD) プラットフォームです。

参考: [Google Cloud Platform Japan 公式ブログ: Spinnaker 1.0 : マルチクラウド対応の継続的デリバリ プラットフォーム](https://cloudplatform-jp.googleblog.com/2017/06/spinnaker-10-continuous-delivery.html)

まずは、Spinnaker が入った GCE インスタンスを用意します。面倒なので [Google Cloud Launcher](https://cloud.google.com/launcher/) を使います。GCP の Web コンソールから GUI で選択していくだけで Spinnaker を立てることができます。Spinnaker を操作する [Halyard](https://www.spinnaker.io/setup/install/halyard/) というツールは現在、Ubuntu Server 14.04 LTS のみのサポートなので、諸々のセットアップを考えると Cloud Launcher 経由が楽だなと思ったからです。

Spinnaker では Web UI にてデプロイのパイプラインを書いていきます。そのために、一旦 Spinnaker をローカルにポートフォワードしてやる必要があります。

```console
$ gcloud compute ssh --project=tellme-tokyo --zone=asia-east1-b spinnaker-1 -- -L9000:localhost:9000 -L8084:localhost:8084
```

これで、localhost:9000 から Spinnaker の画面にアクセスできます。

このままだと、トリガーとなる Docker Hub の情報も、デプロイ先の kubernetes cluster の情報も持っていないので、Spinnaker インスタンスに ssh して Halyard (`hal`) を使って設定します。

```console
b4b4r07@spinnaker-1$ hal config provider docker-registry account add my-docker-registry \
    --address index.docker.io \
    --repositories b4b4r07/tellme.tokyo \
    --username b4b4r07 \
    --password
b4b4r07@spinnaker-1$ gcloud container clusters get-credentials --project hogehoge --zone asia-east1-a cluster-1
b4b4r07@spinnaker-1$ hal config provider kubernetes account add my-k8s-account \
    --docker-registries my-docker-registry
```

うまく行ったらリスタートします。再度 localhost:9000 にいくと、今度は Server Group にデプロイ先の kubernetes のクラスタが表示され、トリガーに `tellme.tokyo` のイメージが表示されるようになります。

```console
b4b4r07@spinnaker-1$ restart spinnaker
```

パイプラインが書けると、`docker push` を契機として Pod の更新 (マニフェストファイルの再配布) が始まるはずです。

## 所感など

移行から 2 週間ほどたちました。色々思うところもありますが、とくに問題もなく運用できています。

```console
$ kubectl get pods
NAME                    READY     STATUS    RESTARTS   AGE
blog-3067350122-db9mr   1/1       Running   0          15d
blog-3067350122-m53g6   1/1       Running   0          15d
blog-3067350122-tkzlh   1/1       Running   0          15d
```

**Pros**

- Kubernetes / Spinnaker のいい勉強になった
- 独自ドメインを利用するために、はてなブログ Pro だったがその料金が浮いた
- はてな側のルールで以前はサブドメイン付き www.tellme.tokyo の URL だったが www. が取れた
- ブログをいろいろな技術の練習場に使える (自分だけの Production 環境)

**Cons**

- ただのブログにしては too much すぎる
- GCP の利用料がかかる
- 過去の記事の移行が面倒、はてブとスターは捨て

いいところも多かったですが、維持費については以前よりも Bad なイメージです。幸いにも今回の移行に際し $300 のクーポンが発券されていたので、それがなくなるまでは GCP で運用を続けようと思います。

それと、単にブログをやる、という目的だけを達成するにはこの図はオーバーすぎるでしょう。この手のブログ配信だと GitHub Pages を使うのが圧倒的にいいはずです。

しかし、このブログの移行と他の Web サービスの GKE 移行なども重ねてきて、とても勉強になりました。ただの静的ファイルの配信は他のアプリ運用のためのいい練習となり、応用にもなる話でもあるので、結果的にはよかったです。また、ハマリポイントなども見えてきたように思います。それはまた別の機会に記事にします。

{{< twitter user="b4b4r07" id="888184800963510273" >}}
