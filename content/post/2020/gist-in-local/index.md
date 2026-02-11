---
title: "ローカルから Gist を編集する方法"
date: "2020-01-28T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

コードスニペットなどの管理によく Gist を使う。
他にも特定の人にテキストを共有する目的で日本語を書いて置いておく場としても利用している。

頻繁に読み書きするとなるとウェブから編集するのは少し手間に感じてくる。
構造化された文章を書くなら慣れたエディタで書きたい。
ローカルにコピペしてきてから編集してウェブ画面でペーストしていたこともあるが、頻繁にとなるとこれも結構面倒くさい。

Gist はあくまでも git リポジトリなので git clone して手元で編集して push することもできる。
かといってそれをやるかというとそれもまた面倒。
テキスト編集するだけなのに git fetch も git commit もしたくない。
なるべくそういったことは隠蔽されていてほしい。
どこに clone するかといったことは ghq を使うことで考えなくてよくなるけど根本的な面倒くささは拭えない。

こういったモチベーションからウェブから読み書きするのと同じ体験をローカルで再現するツールを書いた[^Qiita]。

![](https://raw.githubusercontent.com/b4b4r07/gist/master/docs/screenshot.png)

[gist](https://github.com/b4b4r07/gist) という Gist に対して簡単な CRUD 操作ができるツールを Go で書いた。

{{< hatena "https://github.com/b4b4r07/gist" >}}

gistコマンドは次のサブコマンドを持つ。

| コマンド | 説明 |
|---|---|
| new | 引数に渡されたファイルを Gist にアップロードする。</br>引数がない場合は tmp ファイルを開き、エディタを閉じたらその内容でアップロードする |
| open | 記事一覧を表示して選択されたファイルの Gist ページをブラウザで開く |
| edit | 記事一覧を表示して選択されたファイルをエディタで開く |
| delete | 記事一覧を表示して選択されたファイルの Gist ページを消す |

これらのコマンドは実際に new とか edit する前に内部で次のことをする。

- [/users/:username/gists](https://developer.github.com/v3/gists/#list-a-users-gists) を叩いてユーザのすべての Gist ID を取ってくる
- すべての Gist ID を使って goroutine で git clone する
- Gist ID のリストはファイルキャッシュに持つ

これに加えて、例えば edit だと

- セレクタ UI で Gist 一覧を表示する
- 選択された Gist のファイルをエディタで開く
- 未コミットのファイルがあったら git push する

という感じで動作する。

新しい Gist を追加するときは new からやればそのときにファイルキャッシュも更新するようになっているので、edit するときにも追加したファイルを選択することができる。
ウェブから Gist を追加したときはファイルキャッシュを更新する必要がある (ただの JSON なので消すだけで次回の実行のときに再取得する)[^Plan]。

```console
$ tree ~/.gist
/Users/b4b4r07/.gist
├── b4b4r07
│  ├── 8cdc244f074d024b0ac0415ebc578af9
│  ├── 05dd70cb491a4fe18de6627c8d966ac5
│  ├── 197373082ad1fed866100e6d376dcbdc
│  ├── ...
│  ├── ...
│  └── f26dd264f094e0ca834ce9feadc0c3f1
└── cache.json
```

かなり直感的に動くのでもう自分用途ではこれで良いといった感じになった。

---

実装的には、Page と File という概念を持っていて、

- Page: Gist の ID が発行されるページ。1 Page に複数のファイルを持つことができる
- File: 実際のファイル

という感じになっている。

実際に Gist API 自体も Gist と File は別に管理しているようでこのツールでもそのコンセプトを踏襲して作った。

[^Qiita]: ツール自体は結構前に作っていて [Qiita](https://qiita.com/b4b4r07/items/0032a4508c1868aad491) にも書いたことがある。今回は [promptui](https://github.com/manifoldco/promptui) と [cobra](https://github.com/spf13/cobra) を使ってコードベースを一新したので記事も書き直した
[^Plan]: 例えば Gist が 1,000 件以上ある場合、Paging している関係で 1 リクエスト 100 件取得したとしても結構待たされる。ので場合によっては全件取らない実装も入れてもいいなと思った
