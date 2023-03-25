---
title: "プラグインマネージャ zplug リリース前夜"
date: 2015-12-01T11:34:22+09:00
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/12/01/113422"
tags:
- zsh
- shellscript
- zplug
---

[repo]: https://github.com/b4b4r07/zplug

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/zplug/logo.png)][repo]

ここしばらく [zplug][repo] という zsh 用のプラグインマネージャを作っていた（GitHub でも開発を始めたのは 11/22）。これは、Antigen alternative として**ではなく**、イチから作ったもので、今までよりも簡単に不都合が少なく高速に管理が可能になる予定（予定）。

一応、正式リリース（RC 版？）を明日に公開しようかなと。

そして昨日今日ではバージョンテストをしていて、5.x 系では問題なく動いている。4.x 系になると一部で動かなくなる。zsh の場合 4.x から 4.2.7 までが安定版ブランチのようになっていて（見る限り）、4.3.4 から 4.3.17 までが開発版ブランチのような分かれ方をしていた（5.x に移行するためのテストなのかな？とか）。zplug では 4.3.9 以上での動作を確認した。ひとつ下のバージョンの 4.3.6 では無名関数がうまく動いていなかった（修正すれば動いたんだけどリリースノートに無名関数のことが記載されていないし、深堀りするのも面倒なのでサポートはここで区切ろうと思った次第）

あとは「テスト」を書いていきたい（1500 Lines な zsh script のテスト誰が書きたいんだ…）

**P.S.** [公式の wiki](https://github.com/b4b4r07/zplug/wiki) を編集してくれる方いないですかね。他のプラグインマネージャからの乗り換え方法など

[zsh のプラグインマネージャ - tellme.tokyo](https://b4b4r07.hatenadiary.com/entry/2015/11/24/142143)
