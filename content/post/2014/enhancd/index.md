---
title: "enhancd という autojump/z ライクな bash/zsh プラグインを書いた"
date: 2014-11-20T13:49:01+09:00
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: "https://b4b4r07.hatenadiary.com/entry/2014/11/20/134901"
tags:
- bash
- zsh
- enhancd
aliases:
- /post/2014/11/20/134901/
---

<!-- 【追記 2015-07-21】 -->
<!---->
<!-- [拡張版 cd コマンドの enhancd が生まれ変わった - tellme.tokyo](https://b4b4r07.hatenadiary.com/entry/2015/07/21/142826) -->
<!---->
<!-- <b>enhancd v2.0 として生まれ変わりました。</b> -->
<!---->
<!-- * **enhancd** \[ɛnhǽn-síːdí\] -->
<!-- * [b4b4r07/enhancd.sh - GitHub](http://github.com/b4b4r07/enhancd)  -->
<!-- ![](http://cl.ly/image/252w3b0f1b2P/enhancd.gif) -->

<!-- [![](https://api.star-history.com/svg?repos=babarot/enhancd&type=Date)](https://star-history.com/#babarot/enhancd&Date) -->

<!--
{{< figure
src="https://api.star-history.com/svg?repos=babarot/enhancd&type=Date"
link="https://star-history.com/#babarot/enhancd&Date"
caption="\"[babarot/enhancd](http://github.com/babarot/enhancd)\""
class="text-center" >}}
-->

{{< figure
src="https://user-images.githubusercontent.com/4442708/229307417-50cf53de-594f-4a19-8547-9820d3af2f1c.gif"
src-dark="https://user-images.githubusercontent.com/4442708/229307417-50cf53de-594f-4a19-8547-9820d3af2f1c.gif"
src-light="https://user-images.githubusercontent.com/4442708/229307415-32cb36ee-491d-47c5-b852-e94d802e9584.gif"
caption="\"[babarot/enhancd](http://github.com/babarot/enhancd)\""
class="text-center" >}}

[`enhancd.sh`](http://github.com/b4b4r07/enhancd)  とは [`autojump`](https://github.com/joelthelion/autojump) や [`z.sh`](https://github.com/rupa/z) などにインスパイアされて、後述する `cdhist.sh` をベースに作成されたディレクトリ移動をサポートするツールのことで、今回はそれらにも勝るとも劣らない機能を追加・拡張したので公開することにした。

## 作った経緯

[Bashの小枝集](http://www.unixuser.org/~euske/doc/bashtips/index.html)にて紹介されている `cdhist.sh` というものがある。これは説明にもある通り

>ブラウザの「戻る」や「進む」のようにカレントディレクトリを行ったりきたりできるコマンド。これはリング状のディレクトリバッファを持っており以下の様な使われ方をする...（※都合により引用を解釈の変わらない程度に変更）

```bash
yusuke ~[1]$ . cdhist.sh         # (cdhist を起動)
yusuke ~[2]$ cd /tmp             # (カレントディレクトリが /tmp に移る)
yusuke /tmp[3]$ cd /usr/bin      # (カレントディレクトリが /usr/bin に移る)
yusuke /usr/bin[4]$ -            # (ひとつ前に戻る)
yusuke /tmp[5]$ cd /etc          # (カレントディレクトリが /etc に移る)
yusuke /etc[6]$ -                # (ひとつ前に戻る)
yusuke /tmp[7]$ +                # (ひとつ後に進む)
yusuke /etc[8]$ =                # (ディレクトリの履歴一覧表示)
 3 /usr/bin
 2 ~
 1 /tmp
 0 /etc
yusuke /etc[9]$ = 2              # (リスト上のディレクトリを直接指定)
yusuke ~[10]$ 
```

というスクリプトである。しばらくこれを満足して使っていたのだが、いくつかの不満点を抱くようになった。

- メモリ利用（ディレクトリ移動履歴はキュー変数に保持）なので、シェルを終了すると履歴は消滅する
- 補完が効かないので、履歴一覧を一度表示した後（`=` コマンド）、移動先を選ぶ（`-` コマンドや `+` コマンド）ので2段階の操作が必要
- 有名な [`autojump`](https://github.com/joelthelion/autojump) や [`z.sh`](https://github.com/rupa/z) についている機能の、「過去に移動したディレクトリに飛ぶ」をしたい
- Zsh で動かない

ということがあったので、[`cdhist.sh`](http://www.unixuser.org/~euske/doc/bashtips/index.html) をベースに大幅に機能を拡張した。キュー構造やリング上のディレクトリバッファなどの概念をそのまま踏襲しつつ、移動履歴はすべて外部ファイルに保持している。スクリプト読み込み時にキュー変数に初期化するようにした。また、過去に一度でも行ったことのあるパスなら補完を効かせてジャンプできる。

* [`autojump`](https://github.com/joelthelion/autojump) や [`z.sh`](https://github.com/rupa/z) を使うという手もあったのだけれど、これらは `cd` とジャンプコマンド（`j`、`z`）を別物と考えているので**データベース構築に時間がかかる**し手間というのがあった
* 上述した [`cdhist.sh`](http://www.unixuser.org/~euske/doc/bashtips/index.html) に馴染んでいたというのもある

## 具体的な機能

- Bash/Zsh で動く
- シェルスクリプトのみで実装されているので多くの環境で動く
- 良くも悪くもビルトインの `cd` をラッパーしているのでデータベース構築が簡単（自動登録の機能ももつ）
- リング上のディレクトリバッファを保持、ヒストリを一覧表示できる
  - 例：`cd =`
- ブラウザの戻る／進むのようにディレクトリ間を移動できる
  - 例：`cd -`、`cd + 3`
- 過去に一度でも行ったことのあるディレクトリならディレクトリ名を引数に渡せばジャンプできる
  - 例：`cd etc` => `cd /path/to/hoge/etc`
- 登録されたディレクトリ名が重複する場合、順々にジャンプする
  - 例：`cd etc` => `cd /path/to/hoge/etc` => `cd /etc`
  - これについてもリング上になっているので最新のものから補完していく
- 隠しディレクトリはドットを省略してもジャンプできる
  - 例：`cd ssh` => `cd /home/user/.ssh`
- 大文字小文字を区別しない
- 途中まででも該当するものがあればジャンプする
  - 例：`cd mus` => `cd /home/user/Music`
- `peco` によるインタラクティブな補完をサポート（`cd <C-g>`）
- ログファイルに対する記録は原則として移動したディレクトリパス（`$PWD`）に対してのみ行われる
- しかし、自動登録の機能を利用可能。これは移動したディレクトリまでのすべての階層パスおよび、移動先ディレクトリのカレントにある1階層までのディレクトリを追加することができる（環境変数で true とする必要がある）
  - 例：`cd /path/to/hoge/etc`
  - 移動したディレクトリまでのすべての階層パス
  - `/path`
  - `/path/to`
  - `/path/to/hoge`
  - このとき `/path/to/hoge/etc` は登録されない（原則としてログファイル末尾に記録されるため）
  - 移動先ディレクトリのカレントにある1階層までのディレクトリ
  - `/path/to/hoge/etc/dir_a`
  - `/path/to/hoge/etc/dir_b`
  - このとき `/path/to/hoge/etc/dir_b/dir_c` は登録されない（1階層のみ）
- この自動登録は、移動先ディレクトリが `$ENHANCD_DATABASE` 最新10件のうちに登録があれば実行されない
- これは、最新10件程度の時間経過であれば、ディレクトリ構造の変更は行われないであろうというものである
- 最新10件にない場合は、ディレクトリ構造の変更を検知するために自動登録が行われる
- また、この自動登録は履歴を壊さないようにするためファイル上部にまとめて追記される
- ほとんどの設定は環境変数 `ENHANCD_*`から変更可能
- このスクリプトを読み込む前に環境変数を定義する必要があるが、面倒な場合 `~/.enhancd.conf` が利用できる
- この設定ファイルがあれば読み込むようになっているので、これに環境変数を記述しておけば楽

### 細かい挙動について

- はじめに、ログファイル `$ENHANCD_DATABASE` にある最新10件（重複しない）のディレクトリパスで、キュー変数 `$ENHANCD_CDQ` を初期化する
- 以降、`$ENHANCD_DATABASE` と `$ENHANCD_CDQ` の関係性はない
- `cd =` や `cd -/+` で利用する `$ENHANCD_CDQ` はリング上のバッファを持つのでグルグル回りながら利用できる
- ただし、新規ディレクトリ（この場合の新規とはキューに保存されていないディレクトリを指す）に移動した場合、キューにある最古のディレクトリ（デフォルトなら`$ENHANCD_CDQ[9]`）が破棄される
- また、カレントディレクトリが変更されると常に `$ENHANCD_DATABASE` に記録される
- このログファイルはジャンプ用途でも使用される
- スクリプト読み込み時に有効でないディレクトリパスは消去できる

## インストール方法

```console
$ git clone http://github.com/b4b4r07/enhancd.git
```

`~/.bashrc` なり `~/.zshrc` なりに以下を記述する。

```bash
if [ -f ~/enhancd/enhancd.sh ]; then
  source ~/enhancd/enhancd.sh
fi
```

## 使い方

- いつもの要領で `cd` するだけ。
- ちょっと「あのディレクトリにいきたいな」と思ったらそのディレクトリ名で `cd that_dir` するだけ、カレントディレクトリにない限りジャンプできる。
- 直近10件の移動履歴はリング上にバッファされているので `cd =` してみればよい
- `cd -` で戻ったり `cd +` で進んだりできる

詳しくは `man enhancd` と `cd --help` を参照。

## オプション

- `- [num]`
  - `[num]` は省略でき、デフォルト値は1である
  - ディレクトリバッファを逆順で辿れる（戻る）
  - 1 → 2 → 3 →・・・
- `+ [num]`
  - `[num]` は省略でき、デフォルト値は1である
  - ディレクトリバッファを進む事ができる。
  - 履歴が最新の状態で進むと一番最後（最古）に進む
  - リングバッファ上の仕様
  - 1 → 9 → 8 → 7 →・・・
- `= [num]`
  - `[num]` は省略でき、その場合はディレクトリバッファの一覧を表示する
  - 数値が引数として与えられた場合、一覧表示横にある数値のディレクトリパスにジャンプする
  - 文字列が引数として与えられた場合、データベースに登録されているディレクトリにジャンプする
- `-h`, `--help`
  - ヘルプ表示
  - 簡素な為詳しく知るなら `man enhancd`
- `-l`, `--list`
  - 補完候補をデータベースからの履歴のみに絞る
  - 単に `cd` だけの場合、カレントディレクトリやサブコマンドも補完されるため
  - 逆を返せばカレントディレクトリに該当する名前があっても履歴にそのパスがない限り移動されない
- `-L`, `--list-detail`
  - `cd -l` オプションの詳細版
  - `-l` オプションではディレクトリパスのヘッドしか取得できないためパスを知ることができない
  - このオプションでは補完名とその説明枠にフルパスが表示される

## 設定用の環境変数

- `ENHANCD_DATABASE`
  - デフォルト `~/zsh_history`
  - 記録用のログファイルパス
- `ENHANCD_CDQMAX`
  - デフォルト `10` 個
  - キュー変数の最大数
- `ENHANCD_CDHOME`
  - デフォルト `$HOME`
  - このスクリプトで定義されている `cd()` 関数のデフォルトホーム
  - `builtin cd` に引数を渡さなかった時の `$HOME` のこと
- `ENHANCD_REFRESH_STARTUP`
  - デフォルト `true`
  - スクリプト読み込み時にログファイルにある無効なパスをすべて取り除くかどうか
- `ENHANCD_AUTOADD`
  - デフォルト `true`
  - ログファイルの自動追加をするかどうか。自動追加とは上述したとおり、ジャンプする対象ディレクトリのすべての階層と、対象ディレクトリのカレントにあるディレクトリ1階層までの登録を指す
- `ENHANCD_PECO_BIND`
  - デフォルト `^g`（Ctrl-g）
  - [`peco`](https://github.com/peco/peco) によるインタラクティブ補完のキーバインド
- `ENHANCD_COMP_LIMIT`
  - デフォルト `60` 件
  - `cd` の補完時にヒストリから補完する候補件数。ログファイルが肥大化すると補完候補で画面がうめつくされる（ときには表示しきれない）ので制限させる（利用頻度の高い60件で制限）
  - 実質ここで制限しても `-l` オプションで全ての補完を有効にできるので候補から消えるという心配は無問題
- `ENHANCD_DISP_QUEUE`
  - デフォルト `false`
  - キューの機能を使って （`cd -/+` などで）ディレクトリ移動をした時に、キュー変数の内容を標準出力に吐き出す

## その他

- 重大なバグは今のところ見受けられない
- 問題点は issues まで
- ちなみに、*enhanced* + *cd* = *enhancd*
