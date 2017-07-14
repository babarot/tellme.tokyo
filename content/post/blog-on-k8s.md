---
title: "ブログを GKE にのせかえた"
date: "2017-07-11T13:23:30+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: ""
tags: ["k8s", "docker", "GKE"]

---

もともと、はてなブログで tellme.tokyo というブログをやっていました。今回 [Google Container Engine (GKE)](https://cloud.google.com/container-engine/) に移しましたが、[元のブログ](http://b4b4r07.hatenadiary.com)はまだ存在しています。

今回、移行のモチベーションは2つあって、

- 独自ドメインを使いたいという理由だけで、はてなブログ Pro アカウントだった
- ブログはホスティングさえできていればいいので、いろいろな技術の練習場にしたかった

加えて、今とある Web サービスを [kubernetes](https://kubernetes.io/) に載せ替えようとしているのですが、まったく知見がなかったので今回自分のブログをその練習場に使おうと思ったのです。
ということで、ブログ用 ([hugo](https://gohugo.io/)) の Docker コンテナを作って、k8s のマネージドサービスである GKE に移行しました。

## 移行に際しやったこと



