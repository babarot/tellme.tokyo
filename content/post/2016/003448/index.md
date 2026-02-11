---
title: "zplug では Collaborators を募集しています"
date: "2016-09-22T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

{{< hatena "https://github.com/zplug" >}}

zplug は A next-generation plugin manager for zsh と謳い、絶賛開発中の zsh 向けのプラグインマネージャです。設計当初の目標通りフルスタックなツールになってきており、もはや zsh で書かれたというだけの、単なるパッケージマネージャとして使うことができるほどの機能を持ちはじめています。

どんな機能があるか、どんな使い方ができるかなどは[公式の README](https://github.com/zplug/zplug/blob/master/README.md) をご覧ください。最近では、ドキュメントの多言語化にも取り組んでおり、[日本語版の README](https://github.com/zplug/zplug/blob/master/doc/guide/ja/README.md) も追加しました。お気に入りの機能として特筆すると、例えば C 言語で書かれたツールの管理もできます:

```sh
# インストール、アップデートに反応してビルドが走る
zplug "jhawthorn/fzy", \
    as:command, \
    rename-to:fzy, \
    hook-build:"
    {
        make
        sudo make install
    }"
```

現在、zplug では [@b4b4r07](https://github.com/b4b4r07) と [@NigoroJr](https://github.com/NigoroJr) さんの2人で開発・メンテナンスしております。[@zplug-man](https://github.com/zplug-man) は bot メンバーです。zplug ではコミュニケーション用に Slack を導入しており、Slack から zplug-man に作業させたりしています。

- [Join us!](https://zplug.herokuapp.com)

そんな zplug では Collaborators を募集しています。記述する言語は Shell Script (zsh) です。zsh では黒魔術みたいな記述がたくさん出てきます。例えば:

```sh
if (( $#unclassified_plugins == 0 )); then
    # If $tags[use] is a regular file,
    # expect to expand to $tags[dir]/*.zsh
    unclassified_plugins+=( "$tags[dir]"/${~tags[use]}(N.) )
    if (( $#unclassified_plugins == 0 )); then
        # For brace
        unclassified_plugins+=( $(
        zsh -c "$_ZPLUG_CONFIG_SUBSHELL; echo $tags[dir]/$tags[use](N.)" \
            2> >(__zplug::io::log::capture)
        ) )
    fi
    # Add the parent directory to fpath
    load_fpaths+=( $tags[dir]/_*(N.:h) )
```

しかし、Slack で気軽に質問してもらえれば、なんでも答えます。まずは Slack に Join してみましょう！

次のマイナーバージョンアップは v2.3 です (下の gif  は開発中の DEMO)。

![](https://cl.ly/3j3x3q1i2p0t/demo3.gif)

バグレポートがあると嬉しいです。コラボレーター、コントリビューター、よろしくお願いします。ぜひ、使ってみてください。
