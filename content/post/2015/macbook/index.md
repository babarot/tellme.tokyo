---
title: "MacBook 12 inch を買った"
date: "2015-08-14T00:57:24+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: "http://b4b4r07.hatenadiary.com/entry/2015/08/14/120049"
tags: ["macbook", "apple"]

---

<blockquote class="twitter-tweet" data-partner="tweetdeck"><p lang="ja" dir="ltr">来ました <a href="http://t.co/nwUUZSogN6">pic.twitter.com/nwUUZSogN6</a></p>&mdash; BABAROT (@b4b4r07) <a href="https://twitter.com/b4b4r07/status/600917894566957058">May 20, 2015</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

{{< img src="1.jpg" >}}

5/20 に「新しい MacBook」が届いた．Apple のオンラインの [Store](http://store.apple.com/jp/buy-mac/macbook) で，実際にポチったのは4/12なので届くのには1ヶ月以上かかったことになる．

スペックはこの通りだ．

{{< img src="2.jpg" >}}

CPU を最大の 1.3GHz に引き上げた．処理スピードは速いに越したことはない．それと，ここに載っていない変更点として，キーボードを US 配列にした．これはデザイン的な動機もあるが，主として私の用途がプログラミング関連だからだ．デスクトップ PC にも US 配列のキーボードを使用している．

{{< img src="3.jpg" >}}

# Why

なぜ，この賛否両輪ある新しい無印の MacBook を買ったかというと，それまで使っていた MacBook Air (13 inch, Mid 2012) に不満が溜まってきていたからだ．

- **13インチはモバイル機としては大きすぎる**
- **メモリが 4GB**（初のモバイル Mac だったため勝手がわからなかった）
- キーボード（特にスペースキー）の反応が悪くなり始めた
- MacBook がかっこ良すぎた

上2つが特に大きな動機だった．MacBook が発表される前，一度 MacBook Air 11 inch を検討していたくらいに軽さ・小ささを求めていた．

以前，iPad（Airの前）を所有していた．買った当初は頻繁に持ち歩いていたもの，その重さや大きさからか徐々に持ち運ばなくなっていた．そこで，それを売っぱらって iPad mini を買うことにした．iPad mini にしてからは持ち歩くことが増え，また片手でひょいと持ちやすかったため，トイレやらキッチンやら隙間時間を生み出しそうなところには常に連れ歩いた．この携帯性がノート PC にも欲しかった．出かけるとき，ひょいと「PC 使うかわかんないけど持っていくか」となりたかったのだ．

# いざ買ってみて

満足か，後悔か．もちろん大満足である．**とにかく軽くて小さい Mac PC（UNIX 端末）が欲しい人にはピッタリ**なノート PC だと思う．賛否両論あるポイントを中心にレビューしてみる．

{{< img src="4.jpg" >}}

## USB-C

USB-C はまったく新しい規格だ．USB 系の正統進化で，リバーシブルに着脱でき，また給電からデータ転送までマルチな役割を一手に担う．MacBook では，その新しい規格のポートをたったひとつしか採用しなかったことで大きな論争をよんだ．

新しい MacBook は拡張性を犠牲に薄さ・軽さを手に入れた．…とされているが，私はそれを犠牲と捉えていない．むしろ不必要な時代に突入してきて，次第に淘汰されるものだから先取りして排除したに過ぎない，と考えている．

実際に普段使いでもそんなに困らない．「そんなに」としたのは全く困らないわけではないからだ．後述するが，家では USB-C Digital AV Multiport アダプタをかませて，HDMI に外部ディスプレイ，USB-A に外部キーボード（HHKB Pro2），USB-C に充電ケーブルをつないでいる．この環境で，外付け HDD や，USB メモリを繋ぎたい，となると一度外部キーボードを外すことになる．その局面は少ないにせよ，ゼロではない．こうなったときは不便さを感じる．

しかし，ワイヤレス化が進むなか多くの場合，USB-C ひとつでも困ることは少ない．

## Core M CPU

Core M の CPU はタブレットにも採用される CPU らしい．冷却の必要もあまりないためファンレス設計も可能であるが，パワー不足感が否めなかった．

事実，MacBook が発売される前に，スコアに奮わない内容のベンチマーク記事が数多く出回った．

- [新型MacBookのベンチマーク公開！2011年モデルのMacBook Airを下回る](http://www.danshihack.com/2015/04/03/junp/macbook-rumour-2.html)
- [12インチ型MacBookのベンチマークスコアが公開！「MacBook Air」の2011年モデルを下回る結果](http://gori.me/macbook/74114)
- [12インチ型MacBookの下位モデル，「iPad Air 2」と同等のCPU性能](http://gori.me/macbook/74771)
- [12インチ型MacBook，CTOモデルのベンチマークスコアが公開！「MacBook Air (Early 2015)」と同等の性能か？！](http://gori.me/macbook/74205)
- [新型MacBookのCTOモデルはMacBook Air（Early 2015）に近い性能](http://www.danshihack.com/2015/04/05/junp/macbooku-rumour.html)
- ...

実際，どうだったか．

全くの無問題と言っていい．ただし，これは個々人の使い方に大きく左右される．また，私は先の記事を踏まえ，1.3GHz にアップグレードしているため，最下位モデル（1.1GHz）との使用感とはまた変わってくる．

普段，Mac を使うとき，プログラミング関連の用途で使用する．

- Safari（タブ10〜20くらい）
- Terminal.app（`tmux` 上にプロセス多数）
- Byword（ブログや Qiita に使用する）
- MacDown（README を書くときに使用する）
- iMessage
- LINE
- Pocket

少なくともこのくらいのアプリは立ち上げている．ブラウザが Safari なのは，電池の減りを気にしているからではなく，メインブラウザだから．最近の Safari はとてもいい．

更に，家にいるときは USB-C Digital AV Multiport アダプタをかませて，HDMI に外部ディスプレイ，USB-A に外部キーボード（HHKB Pro2），USB-C に充電ケーブルをつないでいる．そして Bluetooth で Magic Trackpad を接続している．Core i5 CPU を積んでいる MacBook Air ですら，外部ディスプレイにつないだ使い方は酷とされている．それなのに，私は MacBook をつないでいる．全く問題ないからだ．カクつくこともなければ，仮想デスクトップをスイッチするときもスムースに切り替わることができる．

それくらいにはパワーがあると思っていい．

{{< img src="5.jpg" >}}

しかし，Photoshop などの Adobe 製品を多数立ち上げて，Xcode や Eclipse などの IDE で開発して，YouTuber のような動画編集をバリバリして…というような人には向かないかもしれない．もしかしたらある程度は耐えられるのかもしれないが，やったことがないので分からないとしか言えない．そもそも，そういう用途向けには MacBook Pro というラインナップが用意されている．あれは 13 inch でも 1kg ちょっとと，パワーがあるくせに軽くて良い．MacBook の圧倒的手軽さには勝てないが．

## キーボード

キーボードは PC とユーザをつなぐ唯一のインタフェースだ．それが糞だと，その PC を使うことをやめてしまうだろう．これについてはとても不安だった．実際に，店頭で何回も試し打ちで確認した（店頭は JIS 配列であったため普段の感覚を完全には試せなかったが）．

実際のところ，その心配は無用だった．個人差はあれど，慣れるとむしろこっちのほうが打ちやすい．しかも2,3日で慣れた．ただ，矢印キーについては非常に慣れづらい変更になっているため，はやく Emacs ライクなキーバインドに慣れたほうがいい．Mac OS はデフォルトで Ctrl-A/E/F/B/N/P などのキーバインドをサポートしている．

{{< img src="6.jpg" >}}

また，個々のキーの下に LED が配置されたらしく，発色がとても綺麗だ．

## 感圧トラックパッド

Force Click 呼ばれるもので，クリックの強弱を感知できるようになった．電源を落とすとクリックできなくなるという魔法のトラックパッドだ．

実際のところ，Force Click のあまり恩恵はあまり感じられない．そもそも出番があまりないからだ．つまり，不便にもなっていない．今までと何ら変わらない．「よし，Force Click の機能を使おう」と思わない限り使わない印象だ．その代わり，**どこでもクリックできるようになった**という機能はとても活躍している．

ホームポジションに手を置いたまま，左右の親指でカーソルを操作してクリックという芸当ができるようになった．今までのトラックパッドはトラックパッドの下部しか反応しなかったので，一度ホームポジションから手を離す必要があったからだ．

## バッテリー

以下のようなアプリたち常時立ち上げて使っている．もちろん，もっと他のアプリを立ち上げていることもあれば，少ないこともあるが．

- Safari（タブ10〜20くらい）
- Terminal.app（`tmux` 上にプロセス多数）
- Byword（ブログや Qiita に使用する）
- MacDown（README を書くときに使用する）
- iMessage
- LINE
- Pocket

ちょっと使ってみた結果，**2時間43分使って100%→72%**だった．この時点で**残り時間4:58**だった．6〜9時間は持ちそうだ．6時間以上も持てば，並みの外出時には充電ケーブルを必要としないだろう．

# 総評

MacBook は使うユーザを選ぶ．冒頭にもあるが，**とにかく軽くて小さい OS X マシンが欲しいなら買い**だ．絶対に後悔しない．

このマシンを買うまで，Mac mini (Mid 2012) と MacBook Air (13 inch, Mid 2012) の環境を持っていた．しかし，MacBook を購入してからは，家では外部ディスプレイにつなぐスタイルに変わり，まさかの MacBook メインマシン状態が続いている（本当は iMac 5K が欲しい）．それでいてもパワー不足を感じさせない MacBook は使い方次第ではパワフルにもこなす器用な野郎といったところだ（ただし，1.3GHz に変更している）．

{{< img src="7.jpg" >}}

iPhone ユーザなら少なからずあるであろう，旧端末をみると「ダサい」と感じるアレが Mac にも来たと思っていい．iPhone 6 ユーザなら iPhone 5s/5 を，iPhone 5s/5 ユーザなら iPhone 4s/4 を見たときに「ショボ！」とか「ダッサ！」と思っただろう．今回の MacBook がそれだ．MacBook Air/Pro のキーボードなどをみたときにダサさしか感じない．それだけ，MacBook が洗練されているように見え，買ったことを満足させる UX になっていると言える．