---
title: "最近の Vim のプラグイン管理について考える"
date: "2016-12-05T00:00:00+09:00"
description: ""
categories: []
draft: true
author: "b4b4r07"
oldlink: "http://b4b4r07.hatenadiary.com/entry/2016/12/05/021806"
tags: ["vim"]

---

この記事は [Vim Advent Calendar 2016](http://qiita.com/advent-calendar/2016/vim) の 5 日目の記事です。

以前、neobundle.vim と vim-plug の[比較記事を書きました](http://qiita.com/b4b4r07/items/fa9c8cceb321edea5da0)。
それから数ヶ月後、dein.vim が登場し、再び比較記事を書こうと思っていたのですが、気づけばあれから 1 年が経っていました。
この記事は半年前 ('16年8月頃) に大枠だけ書き Qiita の限定共有に投稿していたのものを Advent Calendar 向けに書き下ろしたものです。

## Vim プラグインの歴史

### GitHub 以前 (〜2008年)

昔の話です。
Vim script で拡張の機能を書いたらそのスクリプトを [vim.org](http://www.vim.org) にアップして開発者同士で共有したり、ユーザがダウンロードして使っていたようです。
おそらくコレが所謂「プラグイン管理」の始まりなのですが、このときはまだ手動で行われていたようです (残念ながら、このときはまだ Vim に出会っていなかったためその肌感は分かりません...)。

例えば、こんな機能も Vim script で書いた拡張です (autogroup などは考慮してません)。

```vim
autocmd BufWritePre * %s/\s\+$//e
```

Vim 7 から Vimball という機能が Vim 本体に同梱されて、それからはこれを利用するユーザもいたようです。
vim.org からアーカイブされたスクリプトを持ってきて、`:so %` したり、気に入ったら runtimepath 以下に置いて自動読み込みしたり。
その頃の plugins ディレクトリは混沌としていたようです。
ペライチのスクリプトが無造作に転がっており、同名ファイルに気をつけたりアップデートの情報は自分でキャッチしなければなりませんでした。

### GitHub 以降 (2008年〜)

GitHub は 2008 年頃発のサービスですが、翌年には最大の Git のホスティングサービスになっていたようです。
本格的に流行りだしたのは 2011 年ころの印象を受けますが、このソーシャルコーディング時代の新風は Vim プラグイン界にも訪れ、席巻したようです。

Vim 界ではとりわけこのビッグウェーブに乗っかるのは早かったようで、Vim プラグインマネージャの代表的なものを時系列にしてみました (もちろんこれ以外にもたくさんの管理ツールがあります)。

※ 名称は現在 (2016-08-28) の時点でホスティングされている名前を取っています

名称 | Initial commit | 特徴など |
---|---|---
[vim-pathogen](https://github.com/tpope/vim-pathogen) | 2008-10-23 | bundle 以下を全部読み込む。ディレクトリごとに管理できるので革新的であった
[Vundle.vim](https://github.com/VundleVim/Vundle.vim) | 2010-10-17 | Bundler の設計に影響を受けたらしく、設定ファイルを書くだけで GitHub からインストールすることができた
[neobundle.vim](https://github.com/Shougo/neobundle.vim) | 2011-09-17 | Vundle の fork から始まった別物。出来ないことは少ない
[vim-plug](https://github.com/junegunn/vim-plug) | 2013-09-10 | 設計に優れている動作の速い NeoVim 互換のマネージャ
[dein.vim](https://github.com/Shougo/dein.vim) | 2015-12-13 | neobundle.vim をリプレースするべく新設計のもとに作られた。NeoVim でも動作する

GitHub 登場以降は [vim.org](http://www.vim.org) にアップロードされるよりも、こっちで管理することも多くなってきていたようで、git-submodule で管理したり、vim-pathogen を利用して .vim ディレクトリ配下の見通しを良くしたり (ディレクトリごとに管理できた) いろいろ工夫しだしたころのようです。

そして、Vundle.vim によってリモートから直接インストール・アップデートすることができるようになり、モダン化しました。
それ以降、大プラグインマネージャ時代が到来したようです。

**当時を伺える資料など**

- [Vim Scripts](http://vim-scripts.org/vim/tools.html)
- [pathogen.vim - Poor man's package manager. Easy manipulation of 'runtimepath' et al : vim online](http://www.vim.org/scripts/script.php?script_id=2332)
- [Tammer Saleh : The Modern Vim Config with Pathogen](http://tammersaleh.com/posts/the-modern-vim-config-with-pathogen/)
- [Synchronizing plugins with git submodules and pathogen](http://vimcasts.org/episodes/synchronizing-plugins-with-git-submodules-and-pathogen/)
- [vundle the bundler of vim - Shiny happy people coding](http://blog-en.shingara.fr/vundle-the-bundler-of-vim.html)

## vim-plug と dein.vim

### 特徴と知名度

ここ最近 (直近 3 年間) の動向を見るとマストウォッチとなるのはこの 2 大プラグインマネージャでしょう。

機能 | vim-plug | dein.vim
---|---|---
高速インストール | ○ | ○
遅延読み込み | ○ | ○
キャッシュ | ☓ | ○
シンプル | ◎ | ○
高機能 | ○ | ◎
外部ファイル | ☓ | ○ (TOML)

ここで、2 大プラグインマネージャに加えて、日本において絶大な知名度のある neobundle.vim (検索ワードには `NeoBundle` を使用しました) を加えてトレンドを見てみました。

※ 赤:NeoBundle、黄:vim-plug、青:dein.vim

{{< img src="1.png" width="800" >}}

<https://www.google.co.jp/trends/explore?geo=JP&q=dein.vim,NeoBundle,vim-plug>

結果としては NeoBundle がまだまだ元気なようです (ただ、これは検索トレンドなので、移行情報などを調べているのかもしれませんし、内容まではわかりません)。
しかし、登場から半年で dein.vim は neobundle.vim のリプレースと vim-plug に対抗して、急成長中であることがわかります。

### 比較

#### 設定ファイル

dein.vim に関する設定方法は Web に先行記事が出回っているのでそれを参照しましょう。
しかし、基本的に絶賛開発中のプラグインの場合 Web 記事はすぐに使い物にならなくなったりするので (この記事も例外ではありません)、リポジトリの README.md か [`:h dein.vim`](https://github.com/Shougo/dein.vim/blob/master/doc/dein.txt) でどんな機能があるのか見るのが一番です。

Minimal vimrc を見て比較してみます。

<table>
 <tr><th>vim-plug</th><th>dein.vim</th></tr>
 <tr><td><pre>
call plug#begin('~/.vim/plugged')
Plug 'b4b4r07/vim-shellutils'
call plug#end()
</pre></td>
<td><pre>
set runtimepath+=s:dein_path

call dein#begin('/home/b4b4r07/.dein')
call dein#add('b4b4r07/vim-shellutils')
call dein#end()

filetype plugin indent on
</pre></td></tr>
</table>

vim-plug のほうが短くなっています。
このカラクリについて、dein.vim 1 行目は vim-plug は `.vim/autoload` 配下にインストールすることを推奨されているから不要となっています (シングルファイルの利点です)。
dein.vim 5 行目については vim-plug では `plug#end()` に含まれているため不要となっています。
これらの処理がプラグインマネージャ側でハンドリングされるのはメリットデメリット両方ありそうです。

実際には dein.vim にはもう少し設定が必要です。
dein.vim の README.md か bin/installer.sh で吐き出されるミニマル vimrc を参考にしましょう。

#### 読み込み速度

計測したときの条件は以下です。

- Vim 7.4
- 素の Vim
- プラグインは 46 個
	- どちらも同じプラグインを使用
	- どちらも最大限に遅延読み込みを利用
- 100 回計測する ([使ったスクリプト](https://gist.github.com/b4b4r07/3eccb4f8dd9438c706fe7950ef2f669f))
- dein.vim はキャッシュを使わない (後付条件です)

```console
$ vim --startup-time=time.log +q
```

**結果:**

速度 | vim-plug | dein.vim
---|---|---
最大 | 064.258 | 048.796
最小 | 051.208 | 040.023
平均 | 056.659 | 043.699

結果としては dein.vim のほうが速いようです。
dein.vim の最大時間より vim-plug の最小時間のほうが大きいことからみても相当早いと言えそうです。
なお、キャッシュを使用していないので、キャッシュ込みだとひとまず太刀打ちできないと言えそうです（あくまでそれぞれの環境に依存します）。

しかしながら、どちらも十分に速いです。
おそらく人間のエンジニアやプログラマが通常用途でエディタを使う分にはもう誤差であると言えそうです。

ローカルでのファイル編集における応答時間の話で、以下の記事を持ち出すのはイケてないかもしれませんが参考として載せておきます。
1993 年に書かれた応答時間における 3 つの限界の話です。

- [Webサイトの応答時間 – U-Site](https://u-site.jp/alertbox/20100621_response-times)
- [Response Time Limits: Article by Jakob Nielsen](https://www.nngroup.com/articles/response-times-3-important-limits/)

0.1 秒、つまり 100 ミリ秒 (ms) 以下を争ってもユーザの体感できる領域ではないです。
これ以上に関して、ソフトウェアはどうするべきかについては述べられないので、応答時間と人間工学に関する論文なりを読みましょう。

### dein.vim

作者の [@Shougo](https://twitter.com/ShougoMatsu) さんにお話を聞く機会があったため (2015年12月ころ〜)、dein.vim の設計思想は背景部分などについて聞いてみました。

- リリース
	- 2016/1/1 - [Shougo/dein.vim at 00a163e](https://github.com/Shougo/dein.vim/tree/00a163e5eeffa0f2bae8befba9135108120e5c83)
- 初期設計についてのお話 (一般的な)
	- ユーザが少ないうちは後方互換性など気にせずガンガン変更しても問題なかったり
	- ユーザが付いてしまうとそれは大変なので、最初のうちにできるだけ汎用的で優れた作りにしておきたい
	- ちまちま neobundle.vim を改修することも思案したが、内部実装がグチャグチャしてきているのでメンテナンスが大変で、新規機能追加どころではなかった
- 高速で記述量が少なく、メンテしやすく、簡単にテストができる
	- コマンドを全て廃止し、関数のみにし、プラグインの設定は TOML で行う → シンプルな設計
		- プラグインのインストールは unite インタフェースで行うという割り切り (これが Shougo さんの考えるシンプルさ)
		- Vim script で UI を作りたくないという思惑もある
	- neobundle.vim は Vundle からの移行と互換性を目標にしていたので、古い仕様を引きずりすぎていた
- Vim と NeoVim どっちに対応するか
	- 結果としては両方 (Vim 8.0 以上と NeoVim)
	- NeoVim 専用にすると Vim と使い分けるのが面倒だった
	- NeoVim 専用にするとリモートプラグイン((リモートプラグインとは、deoplete で使われている技術です。非同期でリモートプラグイン側を動かして MessageRPC で通信します。NeoVim JOB API はプラグインの一部を非同期で動かしますが、リモートプラグインだとスレッドなしで全体を非同期で動かせます))の起動の遅さが目立った
- 起動速度の最適化
	- neobundle.vim はキャッシュを使えば vim-plug と同等以上であった
	- neobundle.vim のボトルネックはコマンドのパースと、余計なファイル読み込み
	- しかし、適切に読み込むファイルを分割すれば高速化が期待できるので要研究
- 知名度について
	- 特に PR はしていないのに neobundle.vim が一般的になれた発端は Lingr だと推測
	- よく発言することの多いのは vim-jp のメンバーであったりコアな Vim ユーザであるが意外と Read Only な利用者も多いとのこと
- ベンチマーク (Shougo さんの環境での)
	- 123 個のプラグイン、キャッシュありで 79 ミリ秒ほど。環境は NeoVim (2016/02/14 時点)
		- (補足) 後日談で更に高速化したとのこと
- 高速化について
	- これまでのキャッシュはパース結果をキャッシュするだけだった
	- dein.vim では内部状態を保存するようにして、それを読み込んだときの時間を最小化した
	- Vim script 実装でキャッシュという仕組みを使うプラグインでは最速の部類
	- 残るボトルネックは変数の代入だが、これは最適化不能なのでここで打ち止め
	- Vim script でない実装だと、[miv](https://github.com/itchyny/miv) や [vim-hariti](https://github.com/kamichidu/vim-hariti) あたりが速度的に好敵手

参考: <https://herringtondarkholme.github.io/2016/02/26/dein/>

### 標準パッケージ管理

Vim 8.0 (7.4.1480~) からは標準のプラグイン管理機構が追加されました。`:help packages` で見れます。

## まとめ

結論はお好きなプラグインマネージャを使いましょう、です。
どちらも盛んに開発されています。
自分のスタイルやマインドに合致したものを使えばいいと思います。
もちろん vim-plug や dein.vim 以外にもたくさんのプラグインマネージャがあります。
これを機にいろいろ探してみてもいいかもしれません。
