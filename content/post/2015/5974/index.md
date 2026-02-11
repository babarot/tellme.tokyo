---
title: "私の fzf 活用事例"
date: "2015-11-08T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

[peco](https://github.com/peco/peco)、使ってますか。この記事を見ている人なら peco 知っていると思います。[fzf](https://github.com/junegunn/fzf) は、peco と同じようなツールでこちらも同じく Go 言語で書かれています。

以前、Qiita に以下のような記事を書いたところ、意外にも良い反応を得られたので今回はその続編といきます。

- [おい、peco もいいけど fzf 使えよ - Qiita](http://qiita.com/b4b4r07/items/9e1bbffb1be70b6ce033)

タイトルは id:k0kubun さんの[私のpeco活用事例](http://k0kubun.hatenablog.com/entry/2014/07/06/033336)のオマージュです。

# fzf を酷使する

## 最近開いたファイル

最近使ったファイル（MRU; Most Recently Used）にアクセスしたい、なんて局面ありません？僕はしょっちゅうです。Vim では mru.vim や neomru などがあるので困りませんが、それをコマンドラインから操作するには意外と手段がありませんでした。そこで、Vim で使われている MRU の履歴ファイルをシェルから開いてうまいことやろうとなりました。

GIF アニメを見ればどんな具合か一発でわかります。`mru` とすると Vim の MRU プラグインで使用されている履歴ファイルを開き、fzf 上で Ctrl-l とすると `less` で開き、Ctrl-v とすると `Vim` で開きます。GIF には出ていませんが、Ctrl-x を 2 回押すとカーソル下のファイルを削除します。Ctrl-r を押せば、その親ディレクトリを表示します。Tab を押せば複数選択もできます。

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/qiita/fzf/mru.gif)](https://github.com/b4b4r07/dotfiles)

`cp $(mru) .` とコマンドラインから指定してやって、最近開いたファイルをコピーしてくるとかも簡単です。これはライフチェンジングです。また、`less` に色が付いているのは Pygments を通しているからです。`pygmentize` がインストールされている環境ならソースコードに色がつきます。

```sh
mru() {
    local -a f
    f=(
    ~/.vim_mru_files(N)
    ~/.unite/file_mru(N)
    ~/.cache/ctrlp/mru/cache.txt(N)
    ~/.frill(N)
    )
    if [[ $#f -eq 0 ]]; then
        echo "There is no available MRU Vim plugins" >&2
        return 1
    fi

    local cmd q k res
    local line ok make_dir i arr
    local get_styles styles style
    while : ${make_dir:=0}; ok=("${ok[@]:-dummy_$RANDOM}"); cmd="$(
        cat <$f \
            | while read line; do [ -e "$line" ] && echo "$line"; done \
            | while read line; do [ "$make_dir" -eq 1 ] && echo "${line:h}/" || echo "$line"; done \
            | awk '!a[$0]++' \
            | perl -pe 's/^(\/.*\/)(.*)$/\033[34m$1\033[m$2/' \
            | fzf --ansi --multi --query="$q" \
            --no-sort --exit-0 --prompt="MRU> " \
            --print-query --expect=ctrl-v,ctrl-x,ctrl-l,ctrl-q,ctrl-r,"?"
            )"; do
        q="$(head -1 <<< "$cmd")"
        k="$(head -2 <<< "$cmd" | tail -1)"
        res="$(sed '1,2d;/^$/d' <<< "$cmd")"
        [ -z "$res" ] && continue
        case "$k" in
            "?")
                cat <<HELP > /dev/tty
usage: vim_mru_files
    list up most recently files
keybind:
  ctrl-q  output files and quit
  ctrl-l  less files under the cursor
  ctrl-v  vim files under the cursor
  ctrl-r  change view type
  ctrl-x  remove files (two-step)
HELP
                return 1
                ;;
            ctrl-r)
                if [ $make_dir -eq 1 ]; then
                    make_dir=0
                else
                    make_dir=1
                fi
                continue
                ;;
            ctrl-l)
                export LESS='-R -f -i -P ?f%f:(stdin). ?lb%lb?L/%L.. [?eEOF:?pb%pb\%..]'
                arr=("${(@f)res}")
                if [[ -d ${arr[1]} ]]; then
                    ls -l "${(@f)res}" < /dev/tty | less > /dev/tty
                else
                    if has "pygmentize"; then
                        get_styles="from pygments.styles import get_all_styles
                        styles = list(get_all_styles())
                        print('\n'.join(styles))"
                        styles=( $(sed -e 's/^  *//g' <<<"$get_styles" | python) )
                        style=${${(M)styles:#solarized}:-default}
                        export LESSOPEN="| pygmentize -O style=$style -f console256 -g %s"
                    fi
                    less "${(@f)res}" < /dev/tty > /dev/tty
                fi
                ;;
            ctrl-x)
                if [[ ${(j: :)ok} == ${(j: :)${(@f)res}} ]]; then
                    eval '${${${(M)${+commands[gomi]}#1}:+gomi}:-rm} "${(@f)res}" 2>/dev/null'
                    ok=()
                else
                    ok=("${(@f)res}")
                fi
                ;;
            ctrl-v)
                vim -p "${(@f)res}" < /dev/tty > /dev/tty
                ;;
            ctrl-q)
                echo "$res" < /dev/tty > /dev/tty
                return $status
                ;;
            *)
                echo "${(@f)res}"
                break
                ;;
        esac
    done
}
```

この関数を zshrc かなんかに貼り付ければいい感じに動きます。ここに載せる際に少し縮小していますが。全ソースコードは私の dotfiles にあります。

こいつはグローバルエイリアスとの連携で真価を発揮します。分かりやすいように `alias -g from='$(mru)'` とし、`alias -g to='$(dest_dir)'` とします。こうすると．．．

```console
$ cp from to
```

とするだけで、最近使ったファイルを最近使ったディレクトリにコピーできます！！！！便利。もちろん複数コピーとかもできます。

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/qiita/fzf/from_to.gif)](https://github.com/b4b4r07/dotfiles)

コイツのおかげで、今自分がどこにいるかを意識しないでファイルオペレーションが可能となります。「from」や「to」という名前のファイルを扱いたい場合は `\` でエスケープしてやればいいです。面倒を強いられますが、超絶便利エイリアスとのトレードオフです。

`to` エイリアスにある `dest_dir` については enhancd というプラグインに使用している移動履歴ファイルを参照するシェル関数を定義しています。`mru` のように便利なカスタマイズを施しているのでよかったら見てみてください。

- [b4b4r07/dotfiles - GitHub](https://github.com/b4b4r07/dotfiles/tree/master/.zsh)

## ワンライナーを実行する

ワンライナーとは `cat file.csv | sort | uniq -c | sort -nr | awk -F, 'END {print $4}'` のようなものです。これ毎回実行するのダルくありません？かといってエイリアス登録するのも…。上の例では 4 カラム目を抜いていますが、あるときは 3 カラム目なんて場合もあります。こういう例では、エイリアスは使えません。

[![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/qiita/fzf/oneliner.gif)](https://github.com/b4b4r07/dotfiles)

こいつを利用するには[こんな登録用のファイル](https://github.com/b4b4r07/dotfiles/blob/master/doc/misc/commands.txt)を用意してやる必要があります。
`[]` の中にワンライナーの説明を書いてスペースを開けワンライナーを記述します。
ワンライナーの中の `@` マークは実行後のカーソルの位置になります。よく実行する前に編集するワンライナーの箇所においておけばカーソル移動なくスムーズに編集できます。
また、ワンライナーの末尾に `!` を置くとコマンドライン上に展開されず、すぐさま実行されます（`accept-line` の実行）。
ここらへんのルールに関しては[さっきのファイル](https://github.com/b4b4r07/dotfiles/blob/master/doc/misc/commands.txt)の先頭に書いてあるのでどうぞ。

```sh
exec-oneliner() {
    local oneliner_f
    oneliner_f="${ONELINER_FILE:-~/.commnad.list}"

    [[ ! -f $oneliner_f || ! -s $oneliner_f ]] && return

    local cmd q k res accept
    while accept=0; cmd="$(
        cat <$oneliner_f \
            | sed -e '/^#/d;/^$/d' \
            | perl -pe 's/^(\[.*?\]) (.*)$/$1\t$2/' \
            | perl -pe 's/(\[.*?\])/\033[31m$1\033[m/' \
            | perl -pe 's/^(: ?)(.*)$/$1\033[30;47;1m$2\033[m/' \
            | perl -pe 's/^(.*)([[:blank:]]#[[:blank:]]?.*)$/$1\033[30;1m$2\033[m/' \
            | perl -pe 's/(!)/\033[31;1m$1\033[m/' \
            | perl -pe 's/(\|| [A-Z]+ [A-Z]+| [A-Z]+ )/\033[35;1m$1\033[m/g' \
            | fzf --ansi --multi --no-sort --tac --query="$q" \
            --print-query --expect=ctrl-v --exit-0
            )"; do
        q="$(head -1 <<< "$cmd")"
        k="$(head -2 <<< "$cmd" | tail -1)"
        res="$(sed '1,2d;/^$/d;s/[[:blank:]]#.*$//' <<< "$cmd")"
        [ -z "$res" ] && continue
        if [ "$k" = "ctrl-v" ]; then
            vim "$oneliner_f" < /dev/tty > /dev/tty
        else
            cmd="$(perl -pe 's/^(\[.*?\])\t(.*)$/$2/' <<<"$res")"
            if [[ $cmd =~ "!$" || $cmd =~ "! *#.*$" ]]; then
                accept=1
                cmd="$(sed -e 's/!.*$//' <<<"$cmd")"
            fi
            break
        fi
    done

    local len
    if [[ -n $cmd ]]; then
        BUFFER="$(tr -d '@' <<<"$cmd" | perl -pe 's/\n/; /' | sed -e 's/; $//')"
        len="${cmd%%@*}"
        CURSOR=${#len}
        if [[ $accept -eq 1 ]]; then
            zle accept-line
        fi
    fi
    zle redisplay
}
zle -N exec-oneliner
bindkey '^x^x' exec-oneliner
```

この設定ではコマンドラインから Ctrl-x を 2 回押すことで実行できます。

また、全ソースコードは私の dotfiles にあります。

- [b4b4r07/dotfiles - GitHub](https://github.com/b4b4r07/dotfiles/tree/master/.zsh)

## コマンドラインにゴミ箱を実装する

- [Golang でコマンドラインにゴミ箱を実装した話](http://tellme.tokyo/post/2015/05/22/gomi/)
- [b4b4r07/gomi - GitHub](https://github.com/b4b4r07/gomi)

これの Zsh 実装です。

- [b4b4r07/zsh-gomi - GitHub](https://github.com/b4b4r07/zsh-gomi)

![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/zsh-gomi/demo.gif)

`gomi -r` とすれば捨てたファイルの履歴が閲覧でき、Ctrl-v で中身を見ることが出来ます。Ctrl-x 2 回で本当に削除（`rm`）し、Enter でリストアできます。

Antigen からインストールでき、`antigen bundle b4b4r07/zsh-gomi` で OK です（zshrc に記述していたのですが大きくなったためプラグイン化しました）。

## コマンドラインに Finder を実装する

- [b4b4r07/cli-finder - GitHub](https://github.com/b4b4r07/cli-finder)

![](https://raw.githubusercontent.com/b4b4r07/screenshots/master/cli-finder/demo.gif)

Mac の Finder のようなものです。Ctrl-r でツリースタイルからリストスタイルにスイッチ出来ます。同じく Ctrl-l で `less`、Ctrl-v で Vim です。

# fzf のメリット

fzf のメリットは　`--ansi` と `--expect` です。これによってエスケープシーケンスによる色付けが使用でき、修飾キー含め押されたキーを判定できます。これによって fzf 上でさまざまなケースに応じたコマンドを実行でき、インタラクティブな CLI を実現できます。

# ライトユース

ここまで fzf のオプションなどをフルに活かした使い方を紹介してきました。よくある紹介記事などでは、「peco を使ってコマンド履歴を便利にしよう」とか「ghq+pecoでソースコード管理を統一しよう」とかありますが、アレでやっていることは fzf でももちろんできます。今更出尽くした話題について fzf 版を載せてもあまり新鮮味がないので省略します。見たい場合は、私のリポジトリを見てくれればカスタマイズした fzf 版があるのでどうぞ。

# 最後に

やっぱりインタラクティブフィルタ（選択的インターフェイスのこと）は便利ですね。CLI がライフチェンジングです。特に `--expect` を鬼活用すると便利汁ブシャーなります。

最近、この fzf 活用にハマっていて、インタラクティブフィルタありきのプラグインを 2 つリリースしたので宣伝しておきます。

- [ターミナルのディレクトリ移動を高速化する - Qiita](http://qiita.com/b4b4r07/items/2cf90da00a4c2c7b7e60)
  - [b4b4r07/enhancd - GitHub](https://github.com/b4b4r07/enhancd)
- [コマンドラインでemojiを扱う - Qiita](http://qiita.com/b4b4r07/items/1811f39a5f1418b38ec4)
  - [b4b4r07/emoji-cli - GitHub](https://github.com/b4b4r07/emoji-cli)
