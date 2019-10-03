---
title: "HashiConf '19 に行ってきた"
date: "2019-10-03T17:15:22+09:00"
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
  - hashicorp
  - hashiconf
---

{{< img src="session.png" width="600" >}}

[HashConf '19](https://hashiconf.com/) (9/9 - 9/11) に行ってきた。
HashiConf とは HashiCorp 製品自体の発表であったりそれと使って構築したアーキテクチャやノウハウについて共有するカンファレンスになっている。
今年はシアトルで開催された。

{{< twitter "1171452762116091905" >}}

たくさん面白いキーノートがあったが中でも開発者の多くが歓声をあげていたのははやり初日の [Armon](https://twitter.com/armon) (Co-Founder/CTO) の [Terraform Cloud](https://www.terraform.io/) に関する発表だったと思う。ローンチ以降 Remote State しか扱えなかった Terraform Cloud が、このタイミングで大きく強化され Enterprise 版と遜色ないくらいにまで機能拡張されていた。今後、（個人ユースは Free ということもあり）サクッと Terraform 環境を構築したいときにマッチすると思う。

<a class="embedly-card" data-card-controls="0" href="https://www.hashicorp.com/blog/announcing-terraform-cloud">Announcing Terraform Cloud</a>
<script async src="//cdn.embedly.com/widgets/platform.js" charset="UTF-8"></script>

さらに、[Terraform Cloud / Enterprise に Cost Estimation の機能が追加された](https://www.hashicorp.com/blog/announcing-cost-estimation-for-terraform-cloud-and-enterprise)。これを有効にすると、「この apply によってクラウド使用量からこのくらいのコスト増減が見込める」といった見積もりがとれるようになる。たとえば、Policy を定義できる [HashiCorp Sentinel](https://www.hashicorp.com/sentinel/) と組み合わせて「このマイクロサービスは 1000USD まで」といったポリシーを書くことでコストの意図しない増加を防ぐといったことができるようになった。この機能はめっちゃ便利なので、これを使うためだけに Terraform Cloud を使う価値すらあると思う。

全セッションは HashiCorp の YouTube チャンネルで視聴できる。

{{< hatena "https://www.youtube.com/playlist?list=PL81sUbsFNc5ZFdA6C9HZlaMKdsxtYo5wi" >}}

シアトルに行くのは初めてだったけどとにかく、

- アップダウンが多い
- 晴れない（小雨・霧・曇り）

という感じだった。朝晩は寒すぎてアウターが必要だと思った。

今回はひとりだったのであちこち食べ歩いたりした。中でも [Umi Sake House](https://www.umisakehouse.com/) は美味い鮮魚が食べられるし Sushi のクォリティも高かった。

ホテルは [Cielo](https://www.berkshirecommunities.com/apartments/wa/seattle/cielo/) に泊まった。アパートメントタイプで AirBnb みたいな宿だった。何階建てなのか知らないけど泊まったのは 21 階で見晴らしも良かった。会場まではまっすぐ歩いて 8 ~ 10 分だったのはいいんだけどやっぱり寒かったのでしんどかった。

{{< img src="cielo.png" width="600" >}}

{{< img src="morning.png" width="600" >}}

<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.8440658912423!2d-122.33170618436932!3d47.609721679184844!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54906ab5d0ed2ac7%3A0xc4e458c75a4728a7!2sCielo!5e0!3m2!1sja!2sjp!4v1570093520291!5m2!1sja!2sjp" width="400" height="300" frameborder="0" style="border:0;" allowfullscreen=""></iframe>

今回も会社の福利厚生のひとつ（たぶん）であるカンファレンス参加の支援によって行くことができた。とてもありがたい。
