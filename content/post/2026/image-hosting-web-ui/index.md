---
title: "画像ホスティングサーバーに Web UI をつけた"
date: "2026-03-12T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

[以前の記事](https://tellme.tokyo/post/2026/02/08/obsidian-images-nas/)で、自宅 NAS 上に画像ホスティングサーバーを立てて Obsidian から使えるようにした話を書いた。API Key で認証して `curl` や Obsidian プラグインからアップロードする構成で、これ自体はとても快適に動いている。

ただ、使っていくうちに一つ不便な場面が出てきた。ブラウザから画像をさっとアップロードしたいときだ。ブログ記事用のスクリーンショットを撮って、すぐに URL が欲しい。Obsidian を開くほどでもないし、ターミナルで `curl` を叩くのも地味に手間がかかる。ドラッグ＆ドロップで投げ込んで URL をコピーして終わり、みたいな手軽さがほしかった。

## 認証どうするか問題

API は `X-API-Key` ヘッダーで認証している。CLI なら問題ないが、ブラウザでは API Key をそのまま使うわけにいかない。ブラウザのセッション管理は Cookie ベースが自然で、となると何らかの認証フローが必要になる。

候補は3つあった。

1. **Cloudflare Access** — すでに Cloudflare Tunnel を使っているので相性は良い。IdP として GitHub を設定して特定パスにポリシーを適用すればサーバー側の変更は最小限。ただ、将来 Cloudflare から離れる可能性を考えると Cloudflare 依存を深めたくなかった
2. **GitHub OAuth** — OAuth フローをサーバー自体に組み込む。自己完結するし GitHub アカウントで認証できるので体験も良い
3. **共有パスワード** — 一番シンプルだが UX が微妙

Cloudflare Access は正直かなり魅力的だったが、ポータビリティを取って GitHub OAuth を選んだ。Go の標準ライブラリだけで実装できるし、外部依存を増やさなくて済む。

## 実装

全体の構成はこんな感じ。

```
[ブラウザ]
    │  /login にアクセス
    ↓
[ログインページ]
    │  「Sign in with GitHub」クリック
    ↓
[GitHub OAuth]
    │  認証 → callback
    ↓
[サーバー]
    │  ユーザー名を確認 → セッション Cookie 発行
    ↓
[アップロード UI]
    │  ドラッグ＆ドロップ / クリック / ペースト
    ↓
[POST /api/upload]
    │  セッション Cookie で認証
    ↓
[URL を表示 → コピー]
```

### 認可の設計

ここでちょっと気をつけたのが、既存の API Key 認証との共存。アップロード API (`POST /api/upload`) は API Key **または** セッション Cookie のどちらかが通れば OK にした。これで Obsidian プラグインや `curl` は従来通り API Key で動くし、ブラウザからは Cookie で動く。

一方で削除 API (`DELETE /api/delete/{path}`) は API Key 専用のまま据え置いた。ブラウザ UI で誤って削除する事故を防ぎたかったし、権限を広げすぎないほうがいい。

### セッション管理

インメモリの map でセッションを管理している。個人用途なのでサーバー再起動で全セッションが消えても問題ない。Redis や DB を持ち出すほどの規模ではないし、シンプルに保てるならそれに越したことはない。

OAuth の state パラメータは CSRF 対策として使い捨て（single-use）にした。生成時に 10 分の有効期限をつけて、callback で照合したら即削除する。

### Web UI

UI は `go:embed` でバイナリに同梱した。HTML + vanilla JS のみで、React や Next.js は使っていない。ドラッグ＆ドロップ → アップロード → URL 表示するだけなのでフレームワークを持ち出す必要がなかった。

CSS は [terminal.css](https://terminalcss.xyz/) を使った。モノスペースフォントのターミナルっぽい見た目が気に入っている。ダークモード / ライトモードは `prefers-color-scheme` で OS 設定に追従する。スマホからもアップロードできるようにレスポンシブ対応もした。

アップロード後は URL とファイル名・サイズがテーブルに表示されて、copy ボタンで一発コピーできる。ペースト（Cmd+V）にも対応しているのでスクリーンショットを撮ってそのまま貼り付けることもできる。

### OAuth 未設定時の挙動

GitHub OAuth の環境変数（`GITHUB_CLIENT_ID` 等）を設定しなければ UI ルートは一切登録されず、従来通りの API 専用モードで動く。既存の運用に影響がないようにした。ローカル開発用には `AUTH_DISABLED=true` で認証をスキップするオプションもつけた。

## デプロイ

NAS 上の `compose.yaml` に環境変数を3つ追加するだけ。

```yaml
environment:
  # ... 既存の設定
  - GITHUB_CLIENT_ID=${IMAGE_HOSTING_GITHUB_CLIENT_ID}
  - GITHUB_CLIENT_SECRET=${IMAGE_HOSTING_GITHUB_CLIENT_SECRET}
  - GITHUB_ALLOWED_USERS=${IMAGE_HOSTING_ALLOWED_USERS:-babarot}
```

GitHub の [Developer Settings](https://github.com/settings/developers) で OAuth App を作って、callback URL に `https://assets.babarot.dev/auth/callback` を設定。Client ID と Secret を `.env` に書いて `docker compose up -d` で終わり。

## 使ってみて

`https://assets.babarot.dev/login` にアクセスして GitHub でログインすると、すぐにアップロード画面が出る。ブラウザのタブにファイルを投げ込んで URL をコピー。この手軽さがほしかった。

もちろん Obsidian からのアップロードは今まで通り動く。`curl` も API Key で変わらず使える。ブラウザという選択肢が増えただけで、既存のワークフローには一切影響がない。

コード: https://github.com/babarot/image-hosting-server
