---
title: "自作ツールの gomi をアップデートをした"
date: "2025-01-29T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---

昔、[gomi](https://github.com/babarot/gomi) というターミナルにゴミ箱の概念を実装する CLI コマンドを作っていたのだが、久しぶりに土日を使ってガッツリ書き換えた。ファイルをゴミ箱に移動したり戻したりするという根幹の機能は変えず、UI 部分だけを更新した。

これまでは UI の実装に [promptui](https://github.com/manifoldco/promptui) を使っていた。しかし、Ctrl+W（単語の削除）ができなかったり、Ctrl+C で interrupt した際に UI が崩れたり、そもそも開発がしばらく止まっていたりと、ずっと気になっていた。そんな中、最近 [bubbletea](https://github.com/charmbracelet/bubbletea) (Bubble Tea) というイケてる UI ライブラリを見つけてしまい、めんどくさい半分、興味半分で[置き換えてみた](https://github.com/babarot/gomi/pull/44)。

Bubble Tea は **Elm Architecture（TEA: The Elm Architecture）** が採用されたフレームワークだ。Elm Architecture とは、関数型プログラミングの概念を取り入れたフロントエンドの設計パターンで、シンプルで管理しやすい UI の構築を目的としている。もともとは Elm という言語で使われているが、React や Redux の設計にも影響を与えているらしい。

### Elm Architecture とは
Elm Architecture は、主に以下の3つの要素で構成される。

| 要素   | 役割                                         |
|--------|----------------------------------------------|
| Model  | アプリのステート管理をする                   |
| Update | UI 操作や Message を受け取り、Model を更新する |
| View   | Model から UI を描画する                     |

Elm では View の戻り値として HTML を返すが、Bubble Tea では文字列を返す。見てのとおりシンプルで、実装者は Model（ステート）を介して Update（処理）と View（見た目）を実装するだけでよく、データの流れは Runtime に任せればいい。View の処理が終わると、Runtime によってレンダリングされ、次のサイクルが動く。

```goat

              .--->  Model ---.
             |                 |
             |                 |
             |                 v
   Msg
     .-->  Update             View
    |
    |        ^                 |
  Init       | Msg             | String
    |        |                 v
    |   +----+-----------------+----+
     '--+        Elm Runtime        |
        +---------------------------+

                                                       .
```

<!-- https://github.com/blampe/goat -->

Bubble Tea では `Model` という interface で以下のメソッドを定義し、Elm Architecture を表現している。

- **Init()**
  - 初回の Message を送信し、サイクルをスタートさせる。
- **Update()**
  - Message（キー入力などのイベント）を受け取り、適切な処理を行い、新しい Model を返す。
- **View()**
  - 出力する文字列を組み立てて String を返す。

`Model` interface を満たす構造体 `model` を作成し、`Update()` と `View()`、およびそれらを行き来する `Message` を実装していく流れだ。


キー入力やデータの変更など、いわゆるイベントは `Message` と呼ばれており、これを受け取った `Update` はそれに応じた処理を行い `View` を呼ぶ。`Quit`（サイクルの終了）処理などもユーザーが実装する部分なので、Bubble Tea は基本的に **Update ←(Model)→ View** をひたすら繰り返すというわけだ。

今回、初めて Bubble Tea を使ってターミナルアプリを書いてみたが、Elm Architecture のおかげでスッキリと書けた。また、初学の際は [@motemen さんのブログ](https://motemen.hatenablog.com/entry/2022/06/introduction-to-go-bubbletea)が参考になった。

### 振り返り

久しぶりの実装はめんどくさかったが、結果的に満足のいく仕上がりになってよかった。ちなみに、gomi の[初のリリース](https://github.com/babarot/gomi/releases/tag/v0.1.2)は 2015 年らしい。あの頃はまだ大学生だったが、10 年経ってもまだいじっているとは、我ながら物好きだなと思う。

実は UI の書き換えはこれで 2 回目で、初代 UI[^first] と二代目 UI[^second] がこんな感じ。こうして振り返ると、今回は結構いい感じに仕上がったのではないかと思う。

{{< figure 
src="./demo-3.gif"
caption="三代目UI (2025)"
class="text-center" >}}

{{< figure 
src="./demo-2.png"
caption="二代目UI (2020)"
class="text-center" >}}

{{< figure 
src="./demo-1.gif"
caption="初代 UI (2015)"
class="text-center" >}}

[^tea]: Bubble Tea の Tea は **T**he **E**lm **A**rchitecture からきているのかも
[^first]: コードを見てみたら UI はなんと自前実装で [termbox-go](https://github.com/nsf/termbox-go) を使っていたようだ。まだコードが小さかったときの peco とか fzf を参考に書いたような気がする
[^second]: termbox-go の実装もパクった部分が多くて自分でよくわかってない部分があったのでメンテできなくなっていた。UI は外部に任せたほうがいいなーと思っていて [promptui](https://github.com/manifoldco/promptui) を見つけてからはこっちに乗り換えた
