---
title: "最近、httpstat なるものが流行っているらしい"
date: "2016-09-25T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

おそらく先行実装は python で書かれたこれです。

{{< hatena "https://github.com/reorx/httpstat" >}}

{{< img src="1.png" >}}

curl にはウェブサイトの応答時間を計測する機能が搭載されており、このツールではそれを利用して出力結果をグラフィカルに表示させています。
単なる curl のラッパーのようなツールなのですが、見た目がリッチになるのに加えて、単一ファイルで実行でき python のバージョンに影響されないような工夫がされているのが、受けているポイントのような気がします。

このツールを見たとき「Go で書いてみるの良さそう！（この手のツールで単一バイナリになるのは嬉しいですよね）」と思い、休憩時間やお昼休みなどにちまちま書いていたら、二日前に先を越されてしまいました（そりゃそうですよね。なんでもスピードが大事だと痛感）。

{{< hatena "https://github.com/davecheney/httpstat" >}}

{{< img src="2.png" >}}

また、ついこの間まで 800 Stars くらいだったのですが、ここ1週間で爆発的に伸びています（記事投稿時 1,100 Stars）。
これを機になのか、色々な実装を見るようになりました。知らないだけで他にもあるかもしれません。

- [yosuke-furukawa/httpstat](https://github.com/yosuke-furukawa/httpstat) (JavaScript)
- [tcnksm/go-httpstat](https://github.com/tcnksm/go-httpstat) (Go package)
- [talhasch/php-httpstat](https://github.com/talhasch/php-httpstat) (PHP)

Go で先を越され少し悔しい気もするので、curl のラッパーだしシェルスクリプトでも書いてみようと思い、書いてみました。
なんのメリットがあるかは分かりませんが、bash オンリーで書いているので bash のある環境であれば動くはずです。

{{< hatena "https://github.com/b4b4r07/httpstat" >}}

次に時間があるときは Vim script で書こうかな。
