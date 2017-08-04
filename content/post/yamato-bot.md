---
title: "実用 Slack bot ヤマト編"
date: "2016-12-12"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: "http://b4b4r07.hatenadiary.com/entry/2016/12/12/002116"
tags: ["slack", "bot"]

---

この記事は [Slack Advent Calendar 2016 - Qiita](http://qiita.com/advent-calendar/2016/slack) の 12 日目です。

# はじめに

最近のエンジニアは Slack に常駐していることが多くなってきたと思います。ゆえに bot が便利であることはご存知かと思います。受け取った文字列を echo する bot や、ランダムに画像を返す bot もその練習としてはいいですが、次のステップに bot を書くとしたら実用的なものを書きたいですよね ((記事の導入に関しては[この記事](http://blog.kaneshin.co/entry/2016/12/03/162653)が LGTM なので併せて))。

# 配送状況を通知する

そこで書いたのが、荷物 (ヤマト) の配送状況が変わったら通知してくれる bot です。

{{< hatena "https://github.com/b4b4r07/yamato-bot" >}}

次のような機能を持ちます。

- `bot yamato 追跡番号` とすると bot が追跡番号を監視するようになります
- 現在の配送ステータスを記憶するので変わったら通知してくれます

とりあえず、注文した荷物の追跡番号が発番されたら bot に向かって教えてやればよいです。すると bot は定期的に配送状況をチェックしてくれるようになります。

配送ステータスが変わると以下のように教えてくれるので、ユーザは荷物に対して受け身でいることができます。便利！

{{< img src="/images/yamato-bot.png" width="400" >}}

まだ、[積み残し](https://github.com/b4b4r07/yamato-bot#todos)も多いですがこれだけでも十分に便利でした。[個人 Slack](http://qiita.com/saitotak/items/ac0eb7ddc0d8d83cbe91) にでも通知してやりましょう。

# 謝辞

この bot では nanoblog さんによるヤマト運輸の配送状況を確認する API を使用しています。

- [[WebAPI]ヤマト運輸の配送状況を確認するAPIを作ってみた](http://nanoappli.com/blog/archives/603)
- [[YamaTrack]ヤマト運輸の荷物問合せサイトを作成しました](http://nanoappli.com/blog/archives/787)

# 終わりに

この bot は Node.js で書いてます。[Botkit](https://github.com/foreverjs/forever) のおかげでサクッと書けるのは良いのですが、デーモン化するにあたり [forever](https://github.com/foreverjs/forever) を利用していると色々モヤることが多く、現在は Go 言語 (Supervisord) で書き直しています (本当は間に合わせるはずだった)。

それと、今回この bot を書くにあたり他の手段や先行実装がないかと調べはしたのですが、あまり手応えがなく自作しました((Slack bot だと何気にマルチプラットフォーム対応 (PC/スマホ) できるので便利))。しかし一度 bot 化しておくと、後で自分の要求次第でフレキシブルに作り込めるので、そこは他のツールや手段に勝るメリットだと思います((ただ、これに拘ってはいないので他のいいやり方があったら教えてください))。

以上、Slack Advent Calendar でした。

## あわせて

「終わりに」の後で恐縮ですが、過去に bot に関して書いた記事を思い出したので併せてどうぞ。

[http://www.tellme.tokyo/entry/2016/10/17/205021:embed:cite]

{{< hatena "http://mercan.mercari.com/entry/2016/10/18/120000" >}}

