---
title: "かゆいところに手が届く系の Git Tips 話"
date: "2016-12-20T00:00:00+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: "http://b4b4r07.hatenadiary.com/entry/2016/12/20/110000"
tags: ["git"]

---

この記事は [Git Advent Calendar 2016](http://qiita.com/advent-calendar/2016/git) の 20 日目です。git コマンドを日常的に実行するわけですが、外部スクリプトなどで個人的に日々改善しているお話についてまとめてみました。

# ブランチ切り替えを手早くする

git オペレーションで add,commit 並に多用すると思うのがブランチ切り替えで、特に remote にある branch の切り替えなどをショートカットしたくスクリプトを書きました。

```
$ git br
```

で fzf/peco などのフィルタで切り替えてくれます。ブランチ切り替え系はよくある tips なのですが、何が便利かというと、`remotes/origin/HOGE` などのリモートにしかないブランチは `git checkout -b HOGE remote/origin/HOGE` してくれるようになっているので気にせずに checkout できます。

詳しくは直接スクリプトを読んでみて下さい。簡単なシェルスクリプトです。

<https://github.com/b4b4r07/git-br>

![](https://cl.ly/28143e1J2G2h/git_br.gif)

# ローカルのファイルを GitHub で読む

`hub browse` です。認証しなくて良いので便利です。ブランチを指定するとそのブランチで開いてくれますし、省略すると現在いるブランチで開いてくれます。

```
$ git open
```

フォークして引数にファイル名を渡したら GitHub で開いてくれるようにしたのですが、まだマージされていません。が、僕のフォーク版だと、そのブランチのファイルを開いてくれます。

<https://github.com/b4b4r07/git-open>

![](https://cl.ly/1h1G0I002s1J/git_open.gif)

# 大量のコンフリクトファイルを捌く

多人数で開発するとなると、ブランチ運用がマストなわけですがコンフリクトもまぁ発生するわけです。特に、DB の DNS 設定ファイルなどは同時に多人数が編集することも多く、衝突しやすいファイル群のように思います。解消するファイルが多数ある場合、修正して add するまでどれが完了したかいまいち分かりづらかったので、エディタで編集後にすぐ自動で任意の git コマンドを実行してくれるスクリプトを書きました。

<https://github.com/b4b4r07/git-conflict>

![](https://cl.ly/3O1T0O3d3e0k/git_conflict.gif)

# SSH に切り替える

pull や push には HTTPS と SSH が選べると思いますが、SSH がいいときもあります。切り替えが面倒なのでこれを簡単にしました。`git remote set-url` し直すだけのスクリプトですが、長々とタイプしなくて良いので意外と便利です。

```
$ git url-ssh
```

```sh
#!/bin/bash

url="$(git remote -v | awk '$1=="origin"{print $2;exit}')"

if [[ "$url" =~ ^https?:// ]]; then
    # reconstruct url
    url="$(echo "$url" | \
        perl -pe 's#^https?://(github\.com)/([A-z0-9._-]+)/([A-z0-9._-]+)(\.git)?$#git\@$1:$2/$3#'
    )"

    # to replace git protocol in remote URL with http protocol
    git remote set-url origin "${url}.git" 2>/dev/null
    if [[ $? != 0 ]]; then
        echo "Failed to change remote URL" >&2
        exit 1
    fi

    # Show a remote URL
    echo "Changed!"
    git remote -v
else
    echo "Do nothing"
    git remote -v
fi
```

[f:id:b4b4r07:20161220023143p:plain:w600]

# git status を簡単にする

僕は常にワークスペースの状態を確認しておきたい派です。エイリアスをしたりして打つ文字数を減らすなどは良い案ではありますが、最速は空エンターです。zsh ユーザなら簡単にセットアップできるのでおすすめです。

```sh
do_enter() {
    if [[ -n $BUFFER ]]; then
        zle accept-line
        return $status
    fi

    echo
    if [[ -d .git ]]; then
        if [[ -n "$(git status --short)" ]]; then
            git status
        fi
    else
        # do nothing
        :
    fi

    zle reset-prompt
}
zle -N do_enter
bindkey '^m' do_enter
```

これもよくある Tips な気がするのですが (空エンターで `ls` など) ぶっちゃけ「画面数行確保したい」と思って空エンターすることが多い気がします。そうなるといつでもどこでも `ls` やら `git status` が発動してほしくないわけで、なので僕の場合、git リポジトリでなおかつワーキングスペースに何らかの変更が加えられているときのみ `git status` するようにしています。もちろん、ラインバッファに文字があるときはそれが `accept-line` されます。

![](https://cl.ly/1E0F0S0w3I2S/git_st.gif)

# スペルチェックしてから push する

タイポが蔓延するのを未然に防ぎます。プルリク用のブランチの CI で落としてもいいのですが、リモートにコミット積む前に防ぎたかった (rebase し直すのも面倒ですよね) のと、ローカルだと `--amend` し直せるので pre-push の hook を使います。git では `.git/hooks/` ディレクトリ配下に様々な hook scripts がサンプルとして配置されているので、`.sample` をリネームして書いていきます。終了ステータス (`$?`) が非ゼロで終われば hook 失敗となりそのタスクは実行されません (pre-push hook であれば push が実行されません)。

```sh
#!/bin/bash

find . -type f | xargs misspell -locale US -error
exit $?
```

今回、スペルチェッカーには [misspell](https://github.com/client9/misspell) を使いました。`-error` オプションを渡せば、タイポを見つけたときに非ゼロで終了してくれるので今回の要件にマッチしていたので使いました。気に入ったスペルチェッカーがあればそれを使って非ゼロで終わるようにすれば misspell にかぎらず使用できます。

[https://github.com/client9/misspell:title]

![](https://cl.ly/0X452R17412J/git_push.gif)

# 終わりに

さまざまなテクニック的な部分を Tips として紹介してきました。他にも便利な git サブコマンド系のツールがあったりしますが、一度入れてもなかなか自分のユースケースにフィットしないと使わずに忘れ去られていってしまいます。自分が経験しながら「不便だな、面倒だな」と思う点を自分で解決してゆくと、日々自分のために作業効率が改善される Tips が積み上がっていくと思います。
