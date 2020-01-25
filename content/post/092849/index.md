---
title: "ディレクトリ移動系プラグイン「enhancd」の実装"
date: 2015-08-16T09:28:49+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2015/08/16/092849"
tags:
- bash
- shellscript
- zsh
---

# まえがき

![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/logo.gif)

{{< hatena "http://qiita.com/b4b4r07/items/2cf90da00a4c2c7b7e60" >}}

という記事を Qiita に投稿してみるやいなや、予想以上の反響がありとても焦りました。これは「自分はディレクトリ移動に関してこんな効率化を行っているよ」という Tips なのですが、その際に使ったプラグイン（と言っても自分で作ったのですが）の使い方などをまとめてあるだけの記事です。

Qiita に投稿するときに enhancd についてたくさんを書きすぎても、そもそも ehancd をまず知りもしない人が見るときに困惑するだけだなと思い

、その基本的な動き方（ギミックなど）と使い方の紹介にとどめていました。ところが、これも驚いたことに、予想以上のプルリクエストが来たり、バグレポートがあがったりして「これは実装部分についても言及したいぞ」と思い、ここにまとめることにしました。

注意（以下である体になるのは仕様です）

# enhancd の構想

enhancd は基本的にシンプルな機能しか持ち合わせていない。これは長きに渡りシェルスクリプトを書いてみてよくわかったことがあってのことで、それは「ミニマルでイナフがシンプルへの一番の最適解」であるということ。この考えは UNIX の思想にも似通う。

まず欲しい機能を列挙した。

- 今っぽく（というか今流行の）`peco` とか `percol` でディレクトリ選択したい
- きちんとしたパスじゃなくても、移動履歴からよしなに補完して移動を可能にしたい

この2つは互いに相乗効果が見込めるし、この方向性で詰めるて問題はなさそうだ。それともう一つ。既存の何かを強化するときに大事にしていることは、既にあるその機能をきちんと「強化する」方向性であるかどうかということ。例えば、`cd -`（一つ前のディレクトリに戻る）が「戻る」系の機能ではなく、全く違う別の何かに成り果てることはユーザを戸惑わせるだけだし、とてもナンセンスかなと。`cd` の名前を背負うのだから、既にある機能を尊重しつつ高めるものでなければならない。全く別の機能で塗り替えちゃうことはよくない。


![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/demo.gif)

# enhancd の実装

enhancd には現在、23の関数が定義されていて、それらは2つに大別できる。

- enhancd 以外でも使えるような一般的なユーティリティ関数
- enhancd の機能やそれを補佐するような専用の関数

前者と後者を見分けるために、後者の関数名のプレフィックスには `cd::` が付いている。

次は専用関数の実装について言及する。

## `cd::cd`

これはユーザが実質の `cd` として呼ぶ関数だ（実は `cd` はこれのエイリアスになっている）。

きちんと経路が辿れ、すでに存在している場合は通常の `cd` として振る舞う。辿れない場合こそが…enhancd の本領発揮である。

```sh
cd::cd()
{
# ... 中略

if [ -d "$1" ]; then
    builtin cd "$1"
else
    # t という変数にリストを作る
    # cd::cd が引数なしで実行されたとき、既存の cd を尊重した動きをする
    if empty "$1"; then
        t="$({ cd::cat_log; echo "$HOME"; } | cd::list)"
    else
        t="$(cd::list | cd::narrow "$1")"
    fi

    # t を cd::interfaece に渡す
    # t が空（リストなし）のときは $1 を渡す
    cd::interface "${t:-$1}"
fi

# ... 中略
}
```

`cd::cd` では、それぞれに見合ったディレクトリのリストを作って、それを `cd::interface` に渡すだけである。

## `cd::list`

`cd::list` はディレクトリのリストを作成するだけの関数。

```sh
cd::list()
{
    if [ -p /dev/stdin ]; then
        # 標準入力がある場合それを読み込む
        cat <&0
    else
        # ない場合は、cd::cat_log を呼ぶ
        cd::cat_log
    fi | reverse | unique
    # その内容を反転（reverse）させ重複した行を取り除く（unique）
}
```

`cd::cat_log` はログファイルを `cat` するだけ。ただ、うまく噛みあうような処置を加えている。

```sh
cd::cat_log()
{
    if [ -s "$ENHANCD_LOG" ]; then
        cat "$ENHANCD_LOG"
    else
        echo
    fi
}
```

`reverse` して `unique` しているのはログの履歴の特性上のことである。例えば、このようなログがあるとする。

```console
$ cd /home/lisa/work/dir
$ cat $ENHANCD_LOG
/home/lisa/work
/home/lisa/work/dir
/home/lisa
/home/lisa/src/github.com/b4b4r07/enhancd
/home/lisa/work/dir
```

`reverse` しないで `unique` するとこうなる（ちなみに `uniq` とは違ってソートせずに一意処理できるのが `unique` 関数である）。

```console
$ cat $ENHANCD_LOG | unique
/home/lisa/work
/home/lisa/work/dir
/home/lisa
/home/lisa/src/github.com/b4b4r07/enhancd
```

最新であるはずの `/home/lisa/work/dir` が上の方に重複している `/home/lisa/work/dir` に取り込まれてしまっている。これを防ぐために、一旦反転させてから行う。

```console
$ cat $ENHANCD_LOG | reverse | unique
/home/lisa/work/dir
/home/lisa/src/github.com/b4b4r07/enhancd
/home/lisa
/home/lisa/work
```

しかしこのままでは、ログファイルが逆さま（上が最新）になっているので、もう一度最後に `reverse` する（ただ、enhancd では逆さまのままインタラクティブフィルタリングツールに渡している。というのもそれは、そっち側でうまく扱えるようにするためである）。

## `cd::narrow`

これは絞り込みを行う関数である。`cd::interface` はインタラクティブ・フィルタリングツールを使っての絞り込みだがこれはその前段階である。`cd::cd` に与えられた引数で絞るだけである。存在しなかったら、ここでフィジーサーチにかける。これでもヒットしなかったら本当に存在しないか勘違いして覚えているか。

```sh
cd::narrow()
{
    stdin="$(cat <&0)"
    m="$(echo "$stdin" | awk '/\/.?'"$1"'[^\/]*$/{print $0}' 2>/dev/null)"

    # 引数が正しくなかったら、fuzzy-search をかける
    if empty "$m"; then
        echo "$stdin" | cd::fuzzy "$1"
    else
        echo "$m"
    fi
}
```

`cd::fuzzy` の実装についてはレーベンシュタイン距離（編集距離）を算出し、それをもとに類似度を割り出している。今は 70% 以上の類似度となる文字列を候補としている。その実装のほとんどは awk によって処理している。これ以上の具体的な説明については省略する。

[https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/fuzzy.gif:image=https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/fuzzy.gif]

## `cd::interface`

ここでようやく `cd::interface` である。いわゆる enhancd cd のメイン処理をやっている関数で、引数としては改行で区切られたディレクトリのリストを期待する。それに対して、インタラクティブフィルタリングツール（peco や percol）によってフィルタするからだ。引数にあるリストがこの時点ですでに 1 つのとき、フィルタせずにそのまま移動する。2 つ以上のときフィルタを起動。

```sh
cd::interface()
{
    local list
    list="$1"

    # cd::interface には引数（ディレクトリのリスト）が必要
    if empty "$list"; then
        die "cd::interface requires an argument at least"
        return 1
    fi

    # リストの行数をカウントする
    local wc
    wc="$(echo "$list" | grep -c "")"

    # リストの行数によって振り分け
    case "$wc" in
        0 )
            # Unbelievable branch
            die "$LINENO: something is wrong"
            return 1
            ;;
        1 )
            # 1 件ならフィルタは起動しない
            if [ -d "$list" ]; then
                builtin cd "$list"
            else
                die "$list: no such file or directory"
                return 1
            fi
            ;;
        * )
            # それ以外はフィルタで絞る
            local t
            t="$(echo "$list" | eval "$filter")"
            if ! empty "$t"; then
                if [ -d "$t" ]; then
                    builtin cd "$t"
                else
                    die "$t: no such file or directory"
                    return 1
                fi
            fi
            ;;
    esac
}
```

これによって最初の構想が実現できた。

# その他の機能

enhancd には `cd -` と `cd ..` という機能がある。これはどちらも既存のものを尊重して拡張した機能になっている。

`cd -` は「前にいたディレクトリ」に戻る機能である。最新 10 件のディレクトリヒストリだけを限定に絞込を行う。ここでも引数を取ることができるので、ここでも 1 件だけにマッチすればフィルタなしに移動でき、複数件にマッチすればそのままフィルタで絞り込む。

![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/cd_hyphen.gif)

`cd ..` はその通り、上のディレクトリに移動する。これは、すでにこれを拡張した bd（zsh-bd）というプラグインがあるが、それを模倣している。

![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/enhancd/bd.gif)

同じく、1 件にマッチすればそのまま移動、複数件にマッチすればフィルタ起動。親ディレクトリに重複した名前がある場合は ID をつけて区別する。

これらの実現に多数の関数が存在する。があくまでも本筋の機能ではないので省略。ただ、`cd::interface` にはディレクトリのリストを渡すというコンセプトは生きているので実装はとても簡単にできる。

新機能（新しいディレクトリリスト）を追加したいときは、候補のディレクトリリストを `cd::interface` に渡すだけ。といっても今のところこれ以上の機能を追加する予定はない。
