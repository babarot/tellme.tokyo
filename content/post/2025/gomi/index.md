---
title: "自作ツールの gomi をアップデートをした"
date: "2025-01-29"
description: ""
categories: []
draft: false
toc: false
---

昔に [gomi](https://github.com/babarot/gomi) というターミナルにゴミ箱の概念を実装する CLI コマンドを作っていて、久しぶりに土日使ってガッツリ書き換えた。ファイルをゴミ箱に移動したり戻したりといった根幹の機能は変えてなくて UI 部分だけ更新した。

これまでは UI の実装は [promptui](https://github.com/manifoldco/promptui) を使っていたが、Ctrl+W (単語の削除) ができなかったり Ctrl+C で interrupt したときに UI が崩れたり、そもそもライブラリの開発がしばらく止まっていたりしてずっと気になっていた。[bubbletea](https://github.com/charmbracelet/bubbletea) というイケてる UI ライブラリを見つけてしまい、めんどくさい半分、興味半分で置き換えてみた[^newui]。bubbletea は Elm Architecture が採用されたフレームワークで、Model という Interface で以下のメソッドが保証されている。

- Init()
    - 初回のデータソースの読み込み (View でレンダリングするデータを読み込む)
- Update()
    - Key input などいろいろな Event に反応して処理を実行し新しい Model を返す
- View()
    - Update が終わったら View に反映されてレンダリングされる
    - 文字列が返されるので TUI であればターミナル上に出力される

キーの入力やデータの変更などいわゆる Event は Message と呼ばれており、Message を受け取った Update はそれぞれに応じた処理をして View を呼ぶというライフサイクルをしている。Quit などもユーザ実装によるところなので bubbletea はひたすらに Update ←(Msg)→ View を繰り返すというわけだ。詳しくは [@motemen さんのブログ](https://motemen.hatenablog.com/entry/2022/06/introduction-to-go-bubbletea)で勉強した。

久しぶりの実装はめんどくさかったけど結果満足する仕上がりになってよかった。ちなみに、gomi の[初回のリリース](https://github.com/babarot/gomi/releases/tag/v0.1.2)は2015年のようだ。あの頃はまだ大学生で、10年経ってもまだいじってるなんて我ながら物好きだなと思う。

実は UI の書き換えは2回目で初代 UI[^first] と二代目 UI[^second] がこんな感じ。こうみると今回は結構いい感じに仕上がったかなと思う。

{{< figure 
src="./demo-3.gif"
caption="三代目UI (今回)"
class="text_center" >}}

{{< figure 
src="./demo-2.png"
caption="二代目UI"
class="text_center" >}}

{{< figure 
src="./demo-1.gif"
caption="初代 UI"
class="text_center" >}}

[^newui]: かなりめんどくさかった。[Pull Request #44 · babarot/gomi](https://github.com/babarot/gomi/pull/44)
[^first]: コードを見てみたら UI はなんと自前実装で [termbox-go](https://github.com/nsf/termbox-go) を使っていたようだ。まだコードが小さかったときの peco とか fzf を参考に書いたような気がする
[^second]: termbox-go の実装もパクった部分が多くて自分でよくわかってない部分があったのでメンテできなくなっていた。UI は外部に任せたほうがいいなーと思っていて [promptui](https://github.com/manifoldco/promptui) を見つけてからはこっちに乗り換えた
