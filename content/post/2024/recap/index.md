---
title: "2024年振り返り"
date: "2024-12-31"
description: ""
categories: []
draft: false
aliases:
- /post/2024/12/31/2024-review/
toc: true
---

# Work

## 会社

来月で10X在籍4年目になる。今年は年始から[会社の大きな構造改革](https://note.com/yamotty_note/n/nf82c8a930e98)があり会社全体、多くのチーム、場合によっては社員個人に大きな変化があった。Focus策定や採用、人事評価制度が止まったりと広範囲な集中と選択が行われた。会社としては大変革だったがより何に集中するべきなのか、今何を一番のイシューとして捉えているのかを全社員のもとに整理することができた機会だった捉えている。
## チーム

これまでは全社Focusがあり、それをブレイクダウンしたチームFocusを持つような形で目標設定の継承をしてきた。今期は戦時として、会社戦略は経営で握りつつも各チームが自律して作戦に寄与するような動きが促された。SREとしてはインフラ領域の利益率を高めるためにサーバ費用 (Google Cloud) のコストカットを中心に取り組んだ。円安の煽りを受けてかなり厳しい時期もあったが、2/3ほどまでコスト圧縮ができた。

また、チーム全体としてもFocusの囚われすぎない1年だったことである意味、各人が自由に動くことができた。各々が状況でボールを拾いながら成果を出せた1年だったと感じる。

## 個人

SREチームのEMだったが (それは今も変わらないが) 評価システムを積極的に凍結させているのでピープルマネジメントというものの必要性が薄まった1年だった。また、今年はチーム組成以来初めてチームの人数が減ったのでEMになって初めて人を送る経験をした。

EMとして動く時間が減りICに割く時間が前年と比べて多く取れたのでいろいろなことに取り組んだ。自分にアサインしたissueは87 closedだった。書いて問題ない範囲で書き出してみる。

- SaaSの契約更新(見直し)
- SLOチューニング
- パートナーの契約ステータスに合わせたTerraformリソースの作成制御
- チームオーナーシップの確立
  - CronJobやDeploymentといったワークロードのチームへの所属
  - CUJを構成するAPIのチームへの所属
  - SLOを構成するCUJのチームへの所属
  - Serverワークロード、API、CUJすべての表示したチームダッシュボードの作成
  - 上記の自動化(Terraform)
- GitHub Enterpriseの活用
- 権限整理、[PAMの活用](https://product.10x.co.jp/entry/2024/12/21/092303)

SLOやオーナーシップあたりが主にコミットしたポイントだったかなと思う。SLOはそれぞれのチームが自律して追いかけられる状態になっていて初めて "機能している" といえるものである。導入で済ませるのではなく、機能したものにしていく継続したメンテナンスが必要だ。

# Life

## 買ってよかったもの

{{< gallery
  match="images/bestbuy/no*"
  sortOrder="asc"
  rowHeight="150"
  margins="5"
  thumbnailResizeOptions="500x500 q90 Lanczos"
  thumbnailHoverEffect="enlarge"
  showExif=false
  previewType="none"
  lastRow="justify"
  embedPreview=true
  loadJQuery=true
>}}

### 1. [Porta Pro® Wireless](https://koss.com/products/porta-pro-wireless)

もともと有線のポタプロを持っていて愛用していた。Apple、SONY、BOSEなど色々なヘッドホンを使ったが自分にはこれが一番合っていた (さらに最も安い)。それの無線版が出ると知って[^portapro]飛びついた (代理店がないので米国からの個人輸入になる)。が、配送先の指定は米国内のみで国外発送は対応していないことを入金後に気づき発送されたPackageが米国内を出国できずが1ヶ月以上宙ぶらりんになる状態が続いた。結果、色々あって受け取ることはできたのだが各所に迷惑をかけてしまったかもしれない (ポタプロのサイトではAlertもなく発送されたのでちょっとよくわからないが..)。性能はやっぱりポタプロ、最高に良い。無線なので会社とかで使うのにめっちゃいいなって思った。

### 2. [Lamdash palm in](https://panasonic.jp/shaver/lamdash-palm.html)

話題になっていた髭剃り。髭は濃くないがそれが逆にカミソリも使いづらかったので電動シェーバーはほしいなと思っていた。めっちゃきれいに剃れるので感動した。

- よかったところ
  - 小さい (パームにインできるくらいって名前通りだね)
  - 見た目がいい
  - 丸洗いできる
  - USB-C充電
- わるかったところ
  - 白が良くて白にしたが謎に白だけ1万くらい高い

### 3. BRIEFING Travel bag (BEAMS BOY別注)

ハンドバッグ。製品はトラベルバッグという名前だけど10-13Lくらいだと思う。そもそもバッグが好きで、すでにかなりコレクションがある[^bag]が今年インした中でこれが一番良かった。普段持ち歩くものはすべてPatagonia Black Hole Cube 3Lに入れていてバッグを変えるたびにCubeだけ入れ替えて持ち物忘れを防いでいるのだが、このハンドバッグはそれがそのまま入るのがかなり良い。小さいバッグだとまるっと入れ替えできないことが多かったのでこの点かなり良かった。見た目も好き。

### 4. [Anker Prime Charger (250W, 6 Ports, GaN)](https://www.ankerjapan.com/products/a2345)

パワーのある充電ステーション。250WまでいけるのでスマホとPCとなにかを繋いでも余裕がある。ロングランアイテムになりそう。また、最近は特にUSB-Cで充電できる機材が増えたので重宝する。

### 5. [Anker Solix C1000 Portable Power Station](https://www.ankerjapan.com/products/a1761)

ポタ電。災害用に使えるのはそうだがUPSとして使えるのが決め手で、自宅でNASを運用しているのでその停電対策として導入した。PCは内蔵バッテリーがあるので停電しても死なないがコンセントに繋がってるNASは停電すると死んでしまう。HDD書き込み中に死んで困るのは当然としてNASで動かしているサーバがいくつかあるのでプロセスが消えるのも困る。そういったものは壁のコンセントに繋がずポタ電を経由しておくだけで停電時はポタ電から電源をとってくれるので瞬断せずに済む。マイクロミリ秒で切り替わるみたいのでほとんどのケースにおいて大丈夫なはず。

### 6. [OLIGHT WARRIOR 3S](https://www.olightstore.jp/warrior-3s-flashlight)

ちゃんとしたライト。災害用の懐中電灯としても良いしクルマいじるときにもいいなと思って買った。その用途だけならもっと安いのでも良いがライトというもの自体が好きで高級なものを買った。所有欲を満たすようなビルドクオリティで満足している。
性能も2300ルーメンありかなり明るい。この前山で使ったが昼間かと思った。タクティカルライトなので防犯的にも使えるかもしれない。

### 7. [Black Hole Duffel 55L](https://www.patagonia.jp/product/black-hole-duffel-bag-55-liters)

デカいダッフルバッグ。スーツケースはあまり好きではないのとデカい荷物で移動するときは車が多いので買った。適当に放り込むだけで良い。荷物常時入れておくことで簡単に出かけられるようになったのとそのまま防災につながってよかった。

## 観たドラマ、映画、読んだ本

印象深かったものをピックアップ

- ドラマ
  - VIVANT
  - 地面師たち
  - 極悪女王
  - 五月の青春
  - グランメゾン東京 (パリも観ようと思ってたけど年内に行けなかった)
- 映画
  - ソウX
  - ラストマイル
  - シビルウォー
- 本
  - 難しくない物理学
  - 書いてはいけない
  - セキュアで信頼性のあるシステム構築

## 車

{{< gallery
  match="images/car/z*"
  sortOrder="desc"
  rowHeight="150"
  margins="5"
  thumbnailResizeOptions="600x600 q90 Lanczos"
  thumbnailHoverEffect="enlarge"
  showExif=false
  previewType="none"
  lastRow="justify"
  embedPreview=true
  loadJQuery=true
>}}

納車して1年たった。初のFR、初のMT、初のスポーツカーだったが今ではすっかり板についてきた気がする。ODOメーターは18,000kmになった。北は北海道、南(西)は名古屋まで行った。東北道680kmを走破するのは大変だったが逆にもうどこへでも行けるぞという自信にもなった。マニュアル車は面倒ではないかとよく聞かれるが1年乗ってみて全然大変ではなかった。運転そのもの自体が苦でない人間であればATもMTもそんなに変わらないと思う。それよりもFRによる走りの違いを感じることがあるのでそういう意味で気にすることは多々あった。

1年はノーマルで乗ろうと特にいじってこなかったので来年はちょっとずつカスタムしていこうと思う。(オートサロンでブースの人と話したついでにリアスポだけ買ってしまった)

## カメラ

メインのカメラを[a7siii](https://www.sony.jp/ichigan/products/ILCE-7SM3)から[a7cii](https://www.sony.jp/ichigan/products/ILCE-7CM2)に入れ替えた。またメインのレンズも[FE 24-50mm F2.8 G](https://www.sony.jp/ichigan/products/SEL2450G)に切り替えた。これまでレンズは、

- tamron 28-75mm f2.8
- FE 24mm F2.8 G
- FE 40mm F2.5 G[^sel40f25g]

の3本で24mmから75mmの焦点距離をカバーしていた。圧倒的軽さの単焦点三兄弟[^three-g]から24mmと40mmを用途に分けて持ち歩いていたがどっちみち中望遠が撮れないのでポートレートやクルマの撮影のときちょっと不便で結局28-75も持ち出すことになり軽さの利を活かしきれてなかった。

24-50は出たとき中途半端なレンジだし自分はいらないなと思っていたが考え直したら三兄弟もカバーしているし、それらをひとまとめにできるGレンズとしてこれが最適なのでは?と思い入れ替えてみた。結果、正解でほぼつけっぱなし運用できている。機体もa7ciiにしたことで画素数も上がりSuper 35mmも使いやすくなったおかげで実質75mm(50mm×1.5)まで1本でカバーできるようになった。それ以上の望遠がほしくなったら70-200mm GM2とか買うのが良いんじゃないかなと思っている。

## ジム、筋トレ

継続できている。通い始めて1年以上経った。昨年パーソナルをお願いしてメニューを固めてそれをベースに筋トレしてきた。ダイエットではなくボディメイクメイン。食事もPFCコントロールしたものを摂取して一応苦労もなく続けられている。今はパーソナルから24Hジムに切り替えて週4-5ペースで通っている。

## 旅行

- 札幌、函館
- 大阪
- 仙台
- 名古屋

{{< gallery
  match="images/travel/*"
  sortOrder="desc"
  rowHeight="150"
  margins="5"
  thumbnailResizeOptions="600x600 q90 Lanczos"
  thumbnailHoverEffect="enlarge"
  showExif=false
  previewType="none"
  lastRow="justify"
  embedPreview=true
  loadJQuery=true
>}}

## 服

在宅だし前ほど買わなくなった。けれどアップデート自体は常にあるのでメモ。

今年買ったのはこのへん。毎シーズンなんだかんだ買っていた[Story mfg.](https://www.storymfg.com/)とかは買わなくなったし着なくなったな。

- [Product Twelve](http://www.producttwelve.jp/)
- [POLYPLOID](https://poly-ploid.com/)
- [DAIRIKU](https://shop.dairiku-cinema.com/)

## サウナ

今年はよく行った。週末ペースで通っていた。買ってよかったのパートで書かなかったけど[Loop](https://www.loopearplugs.jp/)というイヤープラグ (要は耳栓,高級耳栓だが) がサウナに良かった。これ買ったことで行く頻度増えたまである。周りがうるさくても落ち着けるので今や必須である。ちなみに無くしてしまい今はない (見つからないので買い直す予定..)

## イベント

車関係は[Japan Mobility Show](https://www.japan-mobility-show.com/)と[Tokyo Auto Salon](https://www.tokyoautosalon.jp/)に行った。音楽は[Gryffin](https://www.gryffinofficial.com/)と学生時代に好きだったシンガーのライブに行ってきた。このブログの名付け親。今年一番聴いた[Forester](https://www.forester-music.com/)[^spotify]が日本に来るのを待っている。

## ボードゲーム

友人とオンラインで定期開催している。Bi-weeklyペースでできており、いいリフレッシュになっている。ボードゲームは無限にあるので飽きが来ないし定期的に人と話す(仕事以外で)機会が持てている。

# 2025

2024年を振り返ると仕事もちゃんと成果を出し、好きなことも充実 (着実に趣味していた) できた1年だった。来年の目標設定もしたので達成できるように今のペースも崩さずにやっていく。以下は目標の一部。

- いろいろなMT乗る
- マフラー交換
- モータースポーツ参戦
- 引っ越す場所を見つける(もしくはその準備)
- 人生に変化
- 万博の参加
- アウトプット増やす

関わってくれた方、ありがとうございました。来年もよろしくお願いします。

[^sel40f25g]: [ソニー FE 40mm F2.5 Gレビュー｜山本まりこ](https://www.kitamura.jp/shasha/sony/fe-40mm-f2-5-g-3-20210515/)
[^three-g]: [ソニーの小型・軽量なフルサイズGレンズ三兄弟。24mm・40mm・50mm をまるっと試し撮り](https://www.gizmodo.jp/2021/04/sony-fe-prime-lens-triplet-test-shoot.html)
[^bag]: バックパックやスリングバッグが好きで30個くらいあるんじゃないかな
[^portapro]: [KOSSの隠れた名ヘッドホン、ついに｢真の｣ワイヤレスになる](https://www.gizmodo.jp/2024/09/koss-porta-pro-wireless-headphone.html)
[^spotify]: Your Wrapped 2024 by Spotify