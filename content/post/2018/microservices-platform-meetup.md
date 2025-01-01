---
title: "Microservices Platform Meetupで話した"
date: "2018-07-23T14:35:00+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: ""
tags: ["microservices", "talk", "terraform"]

---

<!--
<img src="https://www.terraform.io/assets/images/logo-text-8c3ba8a6.svg">
-->

Microservices における Terraform の活用とユースケースについて話した。

{{% hatena "https://mercari.connpass.com/event/92168/" %}}

Microservices とは UNIX の設計思想にもある *Make each program do one thing well* をもとに書き直し、1つのアプリケーションを複数のサービス (コンポーネント) に分割して、独立して稼働できるようにしたもの。

Monolithic architecture にも Pros/Cons があり、Microservices architecture にも Pros/Cons があるのだが、Monolith から Micrroservices へ移行する際の Cons の1つとしてインフラの Provisioning が挙げられる。
Monolith の場合だと、新機能の追加は同じコードベースをいじることで解決できることが多く、その場合既存のインフラを使いまわしてデプロイすることで実現できる。
しかし、Microservices の場合だと Isolation の観点からインフラを独立させる必要があり、新機能追加 (つまり、Microservices の新規作成) のたびにインフラを用意することがコストとなる。
また、アーキテクチャと同じようにチーム構成をサービス単位で自己組織化させる必要がある (Developer, QA, SRE, ...) のだが、各 Developer がインフラの準備をする必要がある。
インフラ構築・運用に不慣れな Developer をアシストしつつ、これらのブートストラップを自動化する Solution が必要になる。

こういった背景がありその問題点を解決するツールとして Terraform を導入し、Terraform Module を使って Automation / Infrastructure as Code しているという話をした。
この仕組みのおかげで今では Developer は One command で Microservices に必要なセットを構築することができるようになっている。

詳しくはスライドにて。

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/6fa99cd5a1e64db9ae61f638c2711377" title="Micoservices Platform in Mercari" allowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 100%; height: auto; aspect-ratio: 560 / 314;" data-ratio="1.78343949044586"></iframe>
