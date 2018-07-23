---
title: "Microservices Platform Meetupで話した"
date: "2018-07-23T14:35:00+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["microservices", "talk", "terraform"]

---

<!--
<img src="https://www.terraform.io/assets/images/logo-text-8c3ba8a6.svg">
-->

Microservices における Terraform の活用とユースケースについて話した。

{{% hatena "https://mercari.connpass.com/event/92168/" %}}

Microservices とは UNIX の設計思想にもある *Make each program do one thing well.* をもとに書き直し、1つのアプリケーションを複数のサービス(コンポーネント)に分割して、独立して稼働できるようにしたもの。

Monolithic architecture にも Pros/Cons があり、Microservices architecture にも Pros/Cons があるのだが、Monolithic から Micrroservices へ移行する際の Cons の1つとしてインフラの Provisioning が挙げられる。
Monolithic の場合だと、新機能の追加は同じコードベースをいじることで解決できることが多く、その場合既存のインフラを使いまわしてデプロイすることで実現できる。
しかし、Microservices の場合だと Isolation の観点からインフラを独立させる必要があり、新機能追加 (つまり、Microservices の新規作成) のたびにインフラを用意することがコストとなってしまう。
また、アーキテクチャと同じようにチーム構成をサービス単位で自己組織化させる必要がある (Developer, QA, SRE, ...) のだが、こうなると各 Developer がインフラの準備をする必要がある。
インフラ構築・運用に不慣れな Developer にそれらをアシストしつつ自動化する Solution が必要になる。

こういった背景がありその問題点を解決するものとして Terraform を使い、Terraform Module を使って Automation / Infrastructure as Code しているという話をした。
そのおかげで Developer は One command で Microservices に必要なセットを構築することができるようになっている。

詳しくはスライドにて。

{{% speakerdeck "71ecf5f02c2a4e949ad4b2fd3c56269f" %}}
