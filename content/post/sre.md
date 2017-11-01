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

最近、といっても今年の7月からですが SRE チームにジョインしました。

そもそも SRE とは Site Reliability Enginnering の略です。
Google が提唱しました。
国内ではメルカリがいち早くに改名したことでも知られています。

[インフラチーム改め Site Reliability Engineering (SRE) チームになりました - Mercari Engineering Blog](http://tech.mercari.com/entry/2015/11/18/153421)

ところで、今からおよそ1年前に入社エントリを書きました。

[新卒でメルカリに入社した話 | tellme.tokyo](https://tellme.tokyo/post/2016/10/01/mercari/)

この頃ちょうど SRE 研修という名目のもと1ヶ月半ほど SRE チームにて業務の一端を担当しました。
研修という名を冠していますが、最前線にいる SRE から普通にタスクをもらって仕事したりレビューしてもらえるという、とても貴重な経験でした。
このときにインフラレイヤでのアーキテクチャ/ネットワークの設計や、実際に SRE が担っている業務領域に興味を持ち、このキャリアパスで飯を食っていきたいと思ったわけです。
無事に研修も終わり元のチームに戻ったわけですが、それ以降以前にもまして、SRE チームの動向ややりとりを羨望してました。

メルカリではクォータの変わり目や定期的な面談などで他分野への興味など広く技術のことについて話す機会があります。
そういった機会を利用しつつたびたびそれとなく話をしていた程度で、メルカリ SRE は技術力の高いチームであることもあり恐れ多くあまり声を大にしていなかったのですが、そうするうちに年も変わりたまたまあるきっかけを得ました。
それは ["deeeet さんという人"が入社する](http://deeeet.com/writing/2017/02/13/mercari/)っぽいぞという情報でした。
以前から尊敬するエンジニアのひとりだったのでひどく興奮したのを覚えています。

ときどき社内で話したり Go のイベントの手伝いや打ち上げなどで話す機会も多くなり、そのたびに「いつ SRE 来るんだ？」をいうジョブをもらい嬉しくも再度自分の思いを正しく伝えようと考えるきっかけになりました。
それからは上長や先輩たちに 1on1 をお願いし、今後自分がどうしていきたいのかなどを相談し、異動へのバックアップをしていただきました[^1]。

晴れて今年の7月から SRE チームにジョインしたわけですが、チーム異動こそがゴールではないので、引き続きやるべきことをやっていく次第です。
直近では以下のようなことに手を出しつつ、Kubernetes を最大限に活用した Microservices 領域での基盤づくりなどを担当しています。

- [メルカリ社内ドキュメントツールの Crowi を Kubernetes に載せ替えました - Mercari Engineering Blog](http://tech.mercari.com/entry/2017/09/11/150000)
- [Cloud Identity-Aware Proxy を使って GCP backend を保護する | tellme.tokyo](https://tellme.tokyo/post/2017/10/30/cloud-iap/)

Microservices でいうと、最近の状況やノウハウ、今後のチャレンジなどをまとめた資料があがっています。

{{< slideshare "zrbK9wQkOA1j8K" "GoogleCloudPlatformJP/microservices-at-mercari" "GoogleCloudPlatformJP/microservices-at-mercari" "@deeeet" >}}

<br>

まだまだ、SRE としての基礎体力が足りんので精進しつつ、Kubernetes とその周りの技術や生態系 (Spinnaker や Prometheus など) についても一線で習熟させていきたいと思います。

以上、初心を忘れないためのメモでした [^2]。

[^1]: 意向を聞き入れてもらえたこととそのサポートにはとても感謝しています
[^2]: 社内でもたまに異動について聞かれるのでメモ
