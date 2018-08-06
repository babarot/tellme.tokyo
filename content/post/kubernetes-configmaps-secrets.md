---
title: "Kubernetes 上で Credentials を扱う"
date: "2018-08-07T01:01:47+09:00"
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
- kubernetes
- kubernetes-configmaps
- kubernetes-secrets
---

アプリケーションにロジックを外側から変更したい場合やソースコード外から設定されるべき情報 (API キーや何らかのトークン、その他の Credentials など) をアプリケーション側から読み取れるようにしたい場合がある。
よくある方法として、環境変数やフラグなどがある。

しかしこれらは往々にしてアプリケーションにハードコードされがちである (ロジックが書かれたファイル外に定義されたとしてもそれはハードコードに等しい)。
そうすると設定変更のたびにデプロイを必要とするし、言わずもがなセキュリティ的には厳しい。

またこの問題は、コンテナとマイクロサービスの領域において更に顕著になる。
同じデータを2つの異なるコンテナで参照する必要がある場合や、ホストマシンが使えないのでどうやってコンテナ内に渡すべきかを考える必要が出てくる。

実際にハードコードされたアプリケーションから環境変数に移し、それらをコンテナ化し Kubernetes に載せ替えてくステップを追う。

## アプリ側にハードコードされた例

```js
var http = require('http');
var server = http.createServer(function (request, response) {
  const language = 'English';
  const API_KEY = '123-456-789';
  response.write(`Language: ${language}\n`);
  response.write(`API Key: ${API_KEY}\n`);
  response.end(`\n`);
});
server.listen(3000);
```

language やAPI キーを変更する場合は、コードを編集する必要がある。
またバグやセキュリティリーク、ソースコードの履歴を汚すアプローチである。

これの代わりに環境変数を使う。

## 環境変数を使うパターン

### Step 1: 環境変数を読み込む

```js
var http = require('http');
var server = http.createServer(function (request, response) {
  const language = process.env.LANGUAGE;
  const API_KEY = process.env.API_KEY;
  response.write(`Language: ${language}\n`);
  response.write(`API Key: ${API_KEY}\n`);
  response.end(`\n`);
});
server.listen(3000);
```

環境変数を設定できるので、アプリケーションのコードに触れる必要はなくなる。

次のようにして現在のセッションの環境変数を設定できる。

```bash
export LANGUAGE="English"
export API_KEY="123-456-789"
```

### Step 2: Docker の環境変数にする

アプリケーションがコンテナ化されると、ホストの環境変数に依存しなくなる。
逆に言うとコンテナに閉じた環境内で正しく設定される必要がある。
これは Dockerfile の `ENV` ディレクティブで指定できる。

```dockerfile
FROM node:6-onbuild
EXPOSE 3000
ENV LANGUAGE English
ENV API_KEY 123-456-789
```

これを Dockerfile として保存してコードと同じディレクトリに置いてビルドする。

```bash
# ビルド
docker build -t envtest .
# 実行
docker run -p 3000:3000 -ti envtest
```

### Step 3: Kubernetes の環境変数にする

Docker コンテナを Kubernetes に移す。

Dockerfile と同様に、Kubernetes Deployment の YAML ファイルに直接環境変数を指定できる。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: envtest
spec:
  replicas: 1
  template:
    metadata:
      labels:
        name: envtest
    spec:
      containers:
      - name: envtest
        image: gcr.io/<PROJECT_ID>/envtest
        ports:
        - containerPort: 3000
        env:
        - name: LANGUAGE
          value: "English"
        - name: API_KEY
          value: "123-456-789"
```

### Step 4: Kubernetes Secrets と ConfigMaps

Docker コンテナや Kubernetes での環境変数から設定を行う場合、コンテナや Deployment でのやり方に縛られてしまうという欠点がある。
環境変数を変更する場合は、コンテナを再ビルドするか、Deployment を変更する必要がでてくる。
また、この環境変数を他のコンテナや Deployment でも使用したい場合は、変数部分をコピペしていく必要がある。

しかし、Kubernetes は Secrets（機密データ用）と ConfigMaps（非機密データ用）という機能を持ってこれを解決している。

Secrets と ConfigMaps の大きな違いは、Secrets は Base64 エンコーディングで難読化されていること。
今後、Kubernetes のアップデートによって違いが出てくるかも知れないが、機密データ（API キーなど）は Secret に、非機密データ（ポート番号など）は ConfigMap という使い分けでいいと思う。

```bash
# API_KEY を Secret に保存する
kubectl create secret generic apikey --from-literal=API_KEY=123–456
# LANGUAGE を ConfigMap に保存する
kubectl create configmap language --from-literal=LANGUAGE=English
```

次のコマンドでこれらが作成されていることを確認できる。

```bash
$ kubectl get secret
NAME                  TYPE                                  DATA      AGE
apikey                Opaque                                0         45s
default-token-gfzcr   kubernetes.io/service-account-token   3         11d

$ kubectl get configmap
NAME       DATA     AGE
language   1        1m
```

こうすることで Deployment の YAML にハードコードする必要がなくなる。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: envtest
spec:
  replicas: 1
  template:
    metadata:
      labels:
        name: envtest
    spec:
      containers:
      - name: envtest
        image: gcr.io/<PROJECT_ID>/envtest
        ports:
        - containerPort: 3000
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: apikey
              key: API_KEY
        - name: LANGUAGE
          valueFrom:
            configMapKeyRef:
              name: language
              key: LANGUAGE
```

## Secrets と ConfigMaps の更新

Secret や ConfigMap を使って Kubernetes に環境変数を管理させれば、変数の値を変更するときにコードを変更したりコンテナを再ビルドしたりする必要がなくなる。

環境変数の変更は、Secret または ConfigMap を更新したあとに、Pod を再起動することでできる (Pod は起動時に環境変数の値をキャッシュしているため)。

まず、値を更新する。

```bash
kubectl create configmap language --from-literal=LANGUAGE=Spanish -o yaml --dry-run \
    | kubectl replace -f -
kubectl create secret generic apikey --from-literal=API_KEY=098765 -o yaml --dry-run \
    | kubectl replace -f -
```

次に、Pod を再起動する。
これは、新しい Deployment を展開するなどがあるが、Pod を手動で削除することで Deployment に新しい Pod を自動で Rollout させるのが手っ取り早い。

```bash
kubectl delete pod -l name=envtest
```

## 設定をファイルから読む

設定項目が多くない場合は環境変数は適しているが、アプリケーションに渡す必要のあるデータがたくさんあるときには向かない。
よくある解決策は、これらの設定を JSON/YAML/TOML などのファイルに落とし込み、そのファイルをアプリから読み込ませる手法などがある。

Kubernetes は ConfigMaps とSecrets をファイルとしてマウントさせることができる。
環境変数とは異なり、これらのファイルが変更されると、新しいファイルは再起動を必要とせずに実行中の Pod にプッシュされる。
また、複数の Config が置かれたディレクトリをマウントし、Secret/ConfigMap とすることもできる。

```bash
mkdir config && mkdir secret
echo '{"LANGUAGE":"English"}' > ./config/config.json
echo '{"API_KEY":"123-456-789"}' > ./secret/secret.json
```

これに合わせて環境変数ではなくファイルから設定を読むようにアプリケーション側を変更しておく。

```js
var http = require('http');
var fs = require('fs');
var server = http.createServer(function (request, response) {
  fs.readFile('./config/config.json', function (err, config) {
    if (err) return console.log(err);
    const language = JSON.parse(config).LANGUAGE;
    fs.readFile('./secret/secret.json', function (err, secret) {
      if (err) return console.log(err);
      const API_KEY = JSON.parse(secret).API_KEY;
      response.write(`Language: ${language}\n`);
      response.write(`API Key: ${API_KEY}\n`);
      response.end(`\n`);
    });
  });
});
server.listen(3000);
```

> *注: このコードはすべてのリクエストに対してファイルを再読み込みする。プログラムの起動時に一度ファイルを読み込むようにするとファイルの更新は取得されず、ファイルを更新するためにコンテナを再起動する必要がでてくる*

## Docker volumes を使ってファイルをマウントする

ローカルで簡単に試す方法として Docker ボリュームを使って ConfigMaps と Secrets をシミュレートできる。


```bash
# ビルド
docker build -t envtest .
# 実行
docker run -p 3000:3000 -ti \
  -v $(pwd)/secret/:/usr/src/app/secret/ \
  -v $(pwd)/config/:/usr/src/app/config/ \
  envtest
```

> *注: [onbuild コンテナ](https://github.com/nodejs/docker-node/blob/master/6/onbuild/Dockerfile#4)は、コードを `/usr/src/app` ディレクトリに置くため、そこに対してマウントしている*

`localhost:3000` にアクセスすると次にようになる。

![](https://cdn-images-1.medium.com/max/800/1*qqUtUpXoe9DRiMUtcrf0kw.png)

ファイルはコンテナにマウントされており、コードはリクエストごとにファイルを再読み込みするため、ファイルを変更して再起動せずに変更を確認できる。

```bash
echo '{"LANGUAGE":"Spanish"}' > ./config/config.json
```

![](https://cdn-images-1.medium.com/max/800/1*j_sIOIcnmgevdo7zI__XEA.png)

## ファイルから Secret と ConfigMap を作成する

値から Secret/ConfigMap を作成したように、ファイルをデータソースとして作成することもできる。

```bash
# ファイルから Secret を作成
kubectl create secret generic my-secret --from-file=./secret/secret.json
# ファイルから ConfigMap を作成
kubectl create configmap my-config --from-file=./config/config.json
```

## Secret と ConfigMap をファイルとして使う

最後に環境変数の代わりに Secret と ConfigMap をファイルとして使用する Deployment を作成する。

Deployment YAML では、Secret と ConfigMap をボリュームとして使用できる。
これにより、Docker の場合と同様に、コンテナ内のディレクトリにマウントされる。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: envtest
spec:
  replicas: 1
  template:
    metadata:
      labels:
        name: envtest
    spec:
      containers:
      - name: envtest
        image: gcr.io/smart-spark-93622/envtest:file5
        ports:
        - containerPort: 3000
        volumeMounts:
          - name: my-config
            mountPath: /usr/src/app/config
          - name: my-secret
            mountPath: /usr/src/app/secret
      volumes:
      - name: my-config
        configMap:
          name: my-config
      - name: my-secret
        secret:
          secretName: my-secret
```

## 動的に更新

ボリュームを使うことで動的に再マウントすることができる。
これは実行中のプロセスを再起動することなく、新しい Secret 値と ConfigMap 値がコンテナで使用可能になる。

たとえば、LANGUAGE を Klingon に変更し、ConfigMap を更新する。

```bash
echo '{"LANGUAGE":"Klingon"}' > ./config/config.json
kubectl create configmap my-config \
  --from-file=./config/config.json \
  -o yaml --dry-run | kubectl replace -f -
```

数秒（キャッシュに応じて最大1分）で新しいファイルが自動的に実行中のコンテナにプッシュされる。

![](https://cdn-images-1.medium.com/max/800/1*wGebNWPZ_I_x0ruXA0ttrQ.gif)

## まとめ

- コンテナ化したアプリケーションへの設定注入は環境変数が良い
- Dockerfile に書いてビルドするのではなく、Deployment 経由でプロセスに伝えるべき
- Deployment YAML にハードコードするのではなく、Secret / ConfigMap 経由で伝えるべき
- Secret / ConfigMap は Kubernetes の軽量シークレットストアである
- Secret / ConfigMap の違いは、
    - Secret: Base64 エンコードされるため、機密情報 (API ーなど) 向き
    - ConfigMap: 生データのまま保存されるため、それ以外の情報 (ポート番号など) 向き
- Secret / ConfigMap は値としてもファイルとしても作成できる

## 参考

- https://medium.com/google-cloud/kubernetes-configmaps-and-secrets-68d061f7ab5b
- https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/
- https://vidhyachari.wordpress.com/2017/10/08/kubernetes-configmaps-and-secrets/
- https://blog.giantswarm.io/understanding-basic-kubernetes-concepts-iv-secrets-and-configmaps/
- https://medium.com/@xcoulon/managing-pod-configuration-using-configmaps-and-secrets-in-kubernetes-93a2de9449be
- https://ubiteku.oinker.me/2017/03/01/kubernetes-secrets/
- https://cloud.google.com/kubernetes-engine/docs/concepts/secret
