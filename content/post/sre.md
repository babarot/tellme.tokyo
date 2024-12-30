---
title: "SREになった"
date: "2017-11-02T01:33:34+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["SRE"]

---

今年の7月からSREチームに異動した。

SREとは[Site Reliability Enginnering](https://sre.google/books/)を指しGoogle が提唱した概念である。
国内ではメルカリがいち早くチーム名として取り入れたことでも知られている。

[インフラチーム改め Site Reliability Engineering (SRE) チームになりました - Mercari Engineering Blog](http://tech.mercari.com/entry/2015/11/18/153421)

メルカリには[昨年4月に入社した](https://tellme.tokyo/post/2016/10/01/mercari/)ばかりなのになぜ異動なのかというと昨年9月ころから新卒研修の一端として1ヶ月間のSRE研修でSREの業務に携わったことがきっかけだった。それまでSREというものをほぼ知らなかったのだが、インフラ領域でサービスの安定稼働に貢献する様子やSREというRoleが持つ使命に強く惹かれSREとしてキャリアを積んでいきたいと思った。上長や当時の所属チームと何度か交渉させてもらい、新卒でありながら希望通り異動させてもらえることになった。

また、もうひとつ大きなきっかけがある。
[@deeeetさんの入社](http://deeeet.com/writing/2017/02/13/mercari/)だ。
もともとフォローしており知っていたのだが彼の入社後社内で話したりGoのイベント(手伝い/打ち上げ)で話す機会もあり、そのたびに「いつSRE来るんだ？」と声掛けをもらいつづけ一緒に働きたいなと思ったこともきっかけとなった。

晴れて今年の7月からSREチームにジョインしたわけだが、チーム異動こそがゴールではないのでやるべきことをやっていく次第です。まずはインプット。
直近では以下のようなことに手を出しつつ、Kubernetesを最大限に活用したMicroservices領域での基盤づくりなどを担当していく。

- [メルカリ社内ドキュメントツールの Crowi を Kubernetes に載せ替えました - Mercari Engineering Blog](http://tech.mercari.com/entry/2017/09/11/150000)
- [Cloud Identity-Aware Proxy を使って GCP backend を保護する | tellme.tokyo](https://tellme.tokyo/post/2017/10/30/cloud-iap/)

Microservicesでいうと、最近の状況やノウハウ、今後のチャレンジなどをまとめた資料がある。
まだまだ、SRE としての基礎体力が足りていないので精進しつつ、Kubernetesとその周りの技術やエコシステム (SpinnakerやPrometheusなど) についても一線で習熟させていきたい。

{{< slideshare "zrbK9wQkOA1j8K" "GoogleCloudPlatformJP/microservices-at-mercari" "GoogleCloudPlatformJP/microservices-at-mercari" "@deeeet" >}}
