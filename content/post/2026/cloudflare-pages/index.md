---
title: "Obsidianからブログを更新できるようにした"
date: "2026-02-09T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---
## GitHub PagesからCloudflare Pagesに移行した

このブログのホスティングをGitHub PagesからCloudflare Pagesに移行した。

ブログを書くときの理想は「どこでも書けて、すぐ確認できる」ことだと思う。以前はMacでVimを開いて記事を書き、`hugo server`でプレビューして、pushしてデプロイする流れだった。執筆環境をObsidianに移してからは出先でも書けるようになったが、プレビューだけはローカルでHugoを動かす必要があり、結局Macの前に座らないと記事を仕上げられなかった。

Cloudflare Pagesに移行した最大の理由は、PRプレビュー機能にある。PRを作るだけでプレビューURLが自動生成されるので、Obsidianで書いてpush[^push]すればブラウザ上で見た目を確認できる。ローカル環境は不要になり、書いてから公開するまでの一連の作業がモバイルだけで完結するようになった。

## Pagesのビルド設定

| 項目          | 値                          |
| ----------- | -------------------------- |
| フレームワーク     | Hugo                       |
| ビルドコマンド     | `hugo --gc --minify`       |
| ビルド出力ディレクトリ | `docs`                     |
| 環境変数        | `HUGO_VERSION` = `0.152.2` |

Cloudflare PagesはHugoのフレームワークプリセットを持っており、環境変数`HUGO_VERSION`を指定すれば対応するバージョンのHugoを自動でダウンロードしてくれる。

## DNS移行

もともとムームードメインでドメインを取得し、GitHub Pages用のDNS設定をしていた。Cloudflare Pagesでカスタムドメインを使うにはネームサーバーをCloudflareに向ける必要がある。

手順としては:

1. Cloudflareに`tellme.tokyo`ゾーンを追加
2. ムームードメインで「弊社サービス以外のネームサーバ」を選択
3. Cloudflareが提示するネームサーバーを設定
4. Pagesでカスタムドメインを設定し、`tellme.tokyo`を`tellme-tokyo.pages.dev`に向けるCNAMEを追加する



<!--
## プレビュー環境でリンクが壊れる問題

Cloudflare Pagesの最大の魅力であるプレビュー環境で、記事リンクが本番URL (`https://tellme.tokyo`) を向いてしまう問題に遭遇した。トップページはプレビュー環境で表示できるが、各記事へのリンクをクリックすると本番サイトに飛ばされてしまう。

### 原因1: `<base>`タグ

使用しているHugoテーマ (mini) の`head.html`に以下のコードがあった。

```html
<base href="{{ page.Permalink }}" />
```

`<base>`タグはページ内の全相対URLの基準を設定するHTMLタグである。`.Permalink`は`hugo.yaml`の`baseurl` (= `https://tellme.tokyo`) に基づく絶対URLを返すため、プレビュー環境 (`*.pages.dev`) でもすべてのリンクが`https://tellme.tokyo`を基準に解決されてしまう。

対策として`<base>`タグを削除した。

### 原因2: `.Permalink`

記事一覧ページのテンプレートで`.Permalink`を使ってリンクを生成していた。

```html
<a href="{{ $page.Permalink }}">{{ $page.Title }}</a>
```

`.Permalink`は常に`baseurl`ベースの絶対URLを返す。Hugoの`relativeURLs: true`設定は`.Permalink`には効かない。この設定が有効なのは`relURL`/`absURL`テンプレート関数だけである。

`.RelPermalink`に変更した。`.RelPermalink`は相対パス (`/post/2025/nas/`) を返すため、どのドメインでホストされていても正しく動作する。

### テーマの修正方針

当初はtellme.tokyoリポジトリの`layouts/`ディレクトリでテーマのテンプレートをオーバーライドしていたが、miniテーマは自分のフォークなのでテーマ側を直接修正する方がメンテしやすい。オーバーライドファイルは削除し、submoduleを更新した。

-->

## 同期ワークフロー

Obsidianで記事を書いたらGitHub Actionsでtellme.tokyoリポジトリにPRを作成する仕組みも同時に構築した。

```
`vault` repo (Obsidian)
vault/blog/tellme.tokyo/*.md
    │ git push (main)
    ▼
GitHub Actions (sync-blog.yaml)
    │ front matter変換 + page bundle化
    │ tellme.tokyo に PR 作成/更新
    ▼
`tellme.tokyo` repo (PR: preview ブランチ)
    │
    ▼
Cloudflare Pages
    ├── preview ブランチ → プレビューURL
    └── main (merge後) → https://tellme.tokyo
```

<!--
変換スクリプトはPython + PyYAMLで実装した。当初はbash + yqで書いたが、yq v4には`-r`フラグがなかったり、`draft: false`が文字列として評価されるなどの挙動があり、Pythonに切り替えた。

ワークフロー設計ではいくつか試行錯誤があった。

- **PR作成**: gh CLIを試したが、peter-evans/create-pull-requestの方がエッジケース処理が充実しておりコード量も少ないため採用した
- **ブランチ名**: コミットSHAを含む動的ブランチを試したが、pushごとに新しいPRが作られてしまうため固定ブランチ`preview`に落ち着いた
- **削除同期**: Obsidian側で記事を削除した場合の同期を試みたが、既存記事と新規記事の区別ができず断念した

-->

## 移行前後の比較

|            | GitHub Pages        | Cloudflare Pages             |
| ---------- | ------------------- | ---------------------------- |
| ビルド        | GitHub Actions      | Cloudflare Pages自動ビルド        |
| DNS        | ムームーDNS             | Cloudflare DNS               |
| PRプレビュー    | なし                  | 自動 (ブランチごとに固有URL)            |
| Draftプレビュー | `hugo server`ローカルのみ | `--buildDrafts`でプレビュー環境に反映可能 |
| デプロイ速度     | 1-2分                | 数秒〜1分                        |

PRプレビューのおかげでローカル環境なしに記事の見た目を確認できるようになった。Obsidianで書いてpush[^push]するだけで、あとはブラウザ上で完結する。

[^push]: pushはObsidianからできる
