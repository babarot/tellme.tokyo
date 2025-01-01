---
title: 2019年振り返り
date: "2019-12-31T23:59:04+09:00"
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
- review
---

## 仕事

{{< img src="https://user-images.githubusercontent.com/4442708/66998223-d52f6500-f10e-11e9-818a-64165f296466.png" >}}

1月からはメルペイの仕事に積極的に関わる機会があり、そのときに HashiCorp Vault を深ぼることから始まった。
Vault のドキュメントを漁って Vault on GKE のデザインからやることができた。しかしまだまだVaultビギナーなのでもっと追えるようにしようと思っている。

それからのちの GoCon Fukuoka で発表することにもなるが、Cloud Functions をもちいた Microservices の成果の観測を始める Project を作った。
Cloud Functions を大量に作ったのだけど、これを効率的に扱ういい方法がまだ見つかっていない。Serverless framework はあるのだけど、Lambda でさえそこまでアクティブにメンテナンスされていないようで、ここらへんはコントリビューションのしがいがあるかなーと睨んでいる。

そのあとは、Platform (主に Terraform 管理レポジトリ) の US 対応をしたりした。
Platform のグローバル化は Platform チームの目指すべきところでもあり、メルカリチームの悲願でもあるのでそこに貢献できたのはグッド。

10月からはバタバタしているうちに12月になってた。

### コントリビューション

- [Software Design 2019年9月号](https://tellme.tokyo/post/2019/08/27/sd1909/)
- [12 OSS projects (incl. private repos)](https://github.com/search?q=user%3Ab4b4r07+created%3A2019-01-01..2019-12-31)
  - b4b4r07/stein https://github.com/b4b4r07/stein/

### 海外カンファレンス

- [HashiCorp '19](https://tellme.tokyo/post/2019/10/03/hashiconf2019/)
- re:Invent '19

### 登壇

- (mercari.go#6) [Testing with YAML - Speaker Deck](https://speakerdeck.com/b4b4r07/testing-with-yaml)
- (GoConference '19 Summer in Fukuoka) [Cloud Functions in Go at Mercari - Speaker Deck](https://speakerdeck.com/b4b4r07/cloud-functions-in-go-at-mercari)
- (Kubernetes Meetup Tokyo #18) [Kubernetes manifests management and operation in Mercari - Speaker Deck](https://speakerdeck.com/b4b4r07/kubernetes-manifests-management-and-operation-in-mercari)
- (未来大×企業エンジニア 春のLT大会) [Insert an Example of Software Engineer Here - Speaker Deck](https://speakerdeck.com/b4b4r07/insert-an-example-of-software-engineer-here)

## プライベート

{{< img src="home.jpg" >}}

越して2年を迎えた。そろそろ引っ越したいなぁ

### 本、映画

最近、今年分のインプットをまとめた記事を書いた。

- [2019年に読んだ本、観た映画 | tellme.tokyo](https://tellme.tokyo/post/2019/12/28/2019-books-movies/)

今年は途中から地球の歴史に飲み込まれた。
[日本沿岸でリュウグウノツカイが相次いで見つかったという記事](https://www.cnn.co.jp/fringe/35132176.html)をみて「そういえば昔はよく深海とか好きで見ていたなぁ」と思い、改めて調べ直してみることに。チャレンジャー海溝のことを色々調べていくうちに、宇宙に通ずることが多いなぁと思い、今度は宇宙のことを調べ始めることにした。宇宙についても小さい頃から興味があってよく調べていたので、これもハマった。 いろいろな記事や本を漁ったけど体系的に学ぶって意味では次の動画はすごく参考になった。動画に出てきているピースをまた自分なりに因数分解する感じで調べていくと更に楽しかった。

<iframe width="560" height="315" src="https://www.youtube.com/embed/GPdLEKzHd1g" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

あとは、政治経済の勉強もし直すことにした。そのための戦後の歴史、近現代史から見直している。
それプラス、MMT と世界銀行史。高校時代にハマって読んでいた「TPP亡国論」著者、中野剛志の本や三橋貴明の本、藤井聡の経済系の本はおもしろくてチラホラ読んだ。

それと韓国史についても興味をそそられた。主に韓国映画 (「タクシー運転手 約束は海を越えて」など) からだけど、それから韓国史について学べる本もチラチラ漁っている。韓国の民主化の歴史はものすごく面白くて、隣国だというのにこんなにも知らなかったのかと、我々はもっと興味をもなたいとという危機感さえ覚えた。特に[反日種族主義 日韓危機の根源](https://www.amazon.co.jp/dp/4163911588/ref=cm_sw_r_oth_api_i_SCn4Db6W5GDPT)は直近で読み始めている良さそうな本。

同じくらい衝撃を覚えた作品として、HBO による「[チェルノブイリ](https://www.amazon.co.jp/%E3%83%81%E3%82%A7%E3%83%AB%E3%83%8E%E3%83%96%E3%82%A4%E3%83%AA%EF%BC%88%E5%AD%97%E5%B9%95%E7%89%88%EF%BC%89/dp/B07WKKVZTL)」。これ以上に酷く怖いものはなかった。あまりのリアルさとクオリティの高さにチェルノブイリの原発事故についてなんとなくでしか考えたことなかった自分に衝撃が走った。日本の原発稼働について賛否があるなか、自分なりにしっかり現実を見て調べ、自分なりの意見を持つことが重要だと感じた。

![](https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTrgSdp8O7lakCWiYLi4A14cfZFIPe_L33BrCH0AKgB6H1et7YL)

この流れで原発利権についてや、それによる当時の政権がとっていた政策、日米関係、対米自立の重要性、などについて調べるきっかけにもなった。
全然関連性はないけど同じ利権問題で、癌問題から癌利権、なぜ日本で戦後、癌発症率が高まっているのか、日常にあふれる発がん性物質について、抗がん剤を用いないがん治療について調べるなどした。

こういう調べて自分メモだけでまとめちゃう系のインプットもちゃんとアウトプットしないとなぁという気持ちにある。別に誰に読んでほしいなんてないんだけど。自分用に清書する意味で。

あと普通に仕事ごとだけど Kubernetes の基礎的なアーキテクチャなどからもう一度勉強してまとめ始めた。自分の Private Site にデプロイして自分辞書を作っている。Kubernetes 以外にも技術に関するインプットをそこにまとめていきたいと思っている。

### アクティビティ

色々行った（国外は出張なので上に挙げた）。

- 福岡、大分
- 新潟
- 静岡
- 新島、神津島

とくに伊豆七島は良かった。

あと運転も再開した。7年ぶりとか。運転が好きだったので、都内でいつか車を持ちたい！とは思っていたけど、都内でいい車を所持するとなると時間がかかりそうだなーと思っていたんだけど所有欲さえ満たさなきゃシェアカーはいい選択肢だったので Careco に契約して乗りまくった。

Osmo Pocket を買ったのであちこち撮って歩いた。めっちゃ使いやすいしかんたんに良い感じの映像が出来上がる。
ブログ書くノリで動画撮って YouTube でもいいなぁなんて思ってる。特に読書感想文とか映画感想文とか書くよりそのときの熱量で勢いで喋って収録したほうがラクそうだなって。まぁそれなら Osmo Pocket すらいらなくて適当に iPhone でいいんだけどね.

### その他

その他だと、MENTA に回答してみたり、Vue.js 勉強してみたり、副業みたいなことを受けたりと、仕事メルカリ以外のことで没頭できることを探していた1年かも。
あと仕事もほどほどに趣味とか自分の興味の赴くままに生きていた。仕事のキャリアパスだ何だって考えなきゃいけない、影響力だ何だを考えなきゃいけないんだけど良い解も今はないからとりあえず無視で遠回りかもしれないけど興味のままにインプットかなぁって感じ。

## まとめ

なんかもっと色々書こうと思ってたけど思い出せないのと年越しそうなのと疲れたのでまた来年。来年は「やろうやろう」思っていてできていなかったものをやっていく。
