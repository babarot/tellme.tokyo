---
title: "自作ツールの gomi をアップデートをした"
date: "2025-01-29T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---

昔に [gomi](https://github.com/babarot/gomi) というターミナルにゴミ箱の概念を実装する CLI コマンドを作っていて、久しぶりに土日使ってガッツリ書き換えた。ファイルをゴミ箱に移動したり戻したりといった根幹の機能は変えてなくて UI 部分だけ更新した。

これまでは UI の実装は [promptui](https://github.com/manifoldco/promptui) を使っていたが、Ctrl+W (単語の削除) ができなかったり Ctrl+C で interrupt したときに UI が崩れたり、そもそも開発がしばらく止まっていたりしてずっと気になっていた。しかし最近 [bubbletea](https://github.com/charmbracelet/bubbletea) というイケてる UI ライブラリを見つけてしまい、めんどくさい半分、興味半分で[置き換えてみた](https://github.com/babarot/gomi/pull/44)。Bubble Tea は Elm Architecture (TEA: The Elm Architecture)[^tea] が採用されたフレームワークだ。Elm Architecture とは関数型プログラミングの概念を使ったフロントエンドの設計パターンで、単純で管理しやすい UI の構築を目的としている。Elm という言語で使われているが、React や Redux の設計にも影響を与えているらしい。

Elm Architecture では主に3つの要素で構成される。

要素 | 役割
---|---
Model |  アプリのステート管理をする
Update | UI 操作や Message を受け取り処理をして Model を更新する
View | Model から UI を描画する <br> Elm では Html を返すが Bubble Tea では String を返す

実装者は Model (ステート) を介して Update (処理) と View (見た目) を実装するだけでよく、データの流れは Runtime 任せで良いのだ。

```goat

      .--->  Model ---.
     |                 |
     |                 |
     |                 v
                        
   update             view
                        
     ^                 |
     |Msg              |String
     |                 v
+----+-----------------+----+
|        Elm Runtime        | <-------- Init
+---------------------------+     Msg

                                                            .
```

<!-- https://github.com/blampe/goat -->

Bubble Tea では Model という interface で以下のメソッドを定義して Elm Architecture を表現している。Model interface を実装する構造体 model を作り Update() と View()、およびそれらを行き来する Msg を実装していく流れだ。

- Init()
    - 初回の Message を送信し、Runtime をスタートさせる
- Update()
    - Message (キー入力といったイベント) を受け取って何かしらの処理を実行し新しい Model を返す
- View()
    - 出力する文字列を組み立てて String を返す

View が終わったら Runtime によってターミナルにレンダリングされ次のサイクルを動かす。

キーの入力やデータの変更などいわゆるイベントといったものは Message と呼ばれており、Message を受け取った Update はそれぞれに応じた処理をして View を呼ぶというライフサイクルをしている。Quit (サイクルの終了) などもユーザ実装によるところなので Bubble Tea はひたすらに Update ←(Msg)→ View を繰り返すというわけだ。詳しくは [@motemen さんのブログ](https://motemen.hatenablog.com/entry/2022/06/introduction-to-go-bubbletea)で勉強した。

久しぶりの実装はめんどくさかったけど結果満足する仕上がりになってよかった。ちなみに、gomi の[初回のリリース](https://github.com/babarot/gomi/releases/tag/v0.1.2)は2015年のようだ。あの頃はまだ大学生で、10年経ってもまだいじってるなんて我ながら物好きだなと思う。

実は UI の書き換えはこれで2回目で初代 UI[^first] と二代目 UI[^second] がこんな感じ。こうみると今回は結構いい感じに仕上がったかなと思う。

{{< figure 
src="./demo-3.gif"
caption="三代目UI (2025)"
class="text_center" >}}

{{< figure 
src="./demo-2.png"
caption="二代目UI (2020)"
class="text_center" >}}

{{< figure 
src="./demo-1.gif"
caption="初代 UI (2015)"
class="text_center" >}}

[^tea]: Bubble Tea の Tea は The Elm Architecture からきているのかも
[^first]: コードを見てみたら UI はなんと自前実装で [termbox-go](https://github.com/nsf/termbox-go) を使っていたようだ。まだコードが小さかったときの peco とか fzf を参考に書いたような気がする
[^second]: termbox-go の実装もパクった部分が多くて自分でよくわかってない部分があったのでメンテできなくなっていた。UI は外部に任せたほうがいいなーと思っていて [promptui](https://github.com/manifoldco/promptui) を見つけてからはこっちに乗り換えた
