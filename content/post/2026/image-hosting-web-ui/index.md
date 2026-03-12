---
title: "自宅 NAS の画像サーバーに Web UI をつけてブラウザから投げ込めるようにした"
date: "2026-03-12T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---

[以前の記事](https://tellme.tokyo/post/2026/02/08/obsidian-images-nas/)で自宅 NAS 上に画像ホスティングサーバーを立てて Obsidian から使えるようにした話を書いた。API Key で認証し `curl` や Obsidian プラグインからアップロードする構成で、これ自体はとても快適に動いている。

ただ、使っていくうちにブラウザからさっとアップロードしたい場面が出てきた。共有用のスクリーンショットを撮って、すぐに URL が欲しい。Obsidian を開くほどでもないし、ターミナルで `curl` を叩くのも地味に手間がかかる。ドラッグ＆ドロップで投げ込んで URL をコピーして終わり、くらいの手軽さが欲しかった。今回はその対応としてやったことを忘れないために書いておく。

 <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets.babarot.dev/files/2026/03/6893e18ab475506b.gif">
    <source media="(prefers-color-scheme: light)" srcset="https://assets.babarot.dev/files/2026/03/6f1c697ef6f94d69.gif">
    <img alt="/login" src="https://assets.babarot.dev/files/2026/03/6f1c697ef6f94d69.gif" width="100%">
  </picture>

## 認証をどうするか

既存の API は `X-API-Key` ヘッダーで認証している。CLI なら問題ないが、ブラウザでは API Key をそのまま使うわけにいかない。ブラウザのセッション管理は Cookie ベースが自然であり、となると何らかの認証フローが必要になる。

候補は 3 つあった。

1. **Cloudflare Access** — すでに Cloudflare Tunnel を使っているので相性は良い。IdP として GitHub を設定して特定パスにポリシーを適用すればサーバー側の変更は最小限で済む。ただ、Tunnel はあくまでトンネリングの手段として使っているだけで、認証まで Cloudflare に寄せるつもりはなかった。Tunnel 自体いつか Tailscale に変えるかもしれないし、そのときに認証まで巻き込まれると面倒になる
2. **GitHub OAuth** — OAuth フローをサーバー自体に組み込む。自己完結するし GitHub アカウントで認証できるので体験も良い
3. **共有パスワード** — 一番シンプルだが UX が微妙

Cloudflare Access を使うのが一番素直で楽なのだが、GitHub OAuth を選んだ。Cloudflare Access だとメールアドレスを入力して、届いた 6 桁のコードを打ち込んで…というステップが挟まる。GitHub OAuth ならワンクリックで完結するので、「さっとアップロードしたい」という動機とも合っている。

あと、この手の個人サービスは技術の砂場みたいなところがあって、インフラ構成を気軽に変えたくなることがある。そのときに認証ロジックがインフラ側に寄っていると一緒に作り直しになってしまう。アプリケーションレイヤーで自己完結していれば、トンネリングや CDN をどう変えても認証はそのまま動く。変更耐性を高く保っておきたかった。

## 実装

全体の構成は以下の通り。

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

ここで気をつけたのは既存の API Key 認証との共存である。アップロード API（`POST /api/upload`）は API Key または Session Cookie のどちらかが通れば OK にした。これで Obsidian プラグインや `curl` は従来通り API Key で動くし、ブラウザからは Cookie で動く。

一方で削除 API（`DELETE /api/delete/{path}`）は API Key 専用のまま据え置いた。ブラウザ UI で誤って削除する事故を防ぎたいのもあるが、そもそもこのサーバーはシンプルさのために DB を持っていない。ファイルシステムだけがSingle source of truthで、アップロードされたファイルの一覧を問い合わせる手段がない。削除対象は URL を知っている人が API Key で叩くしかなく、ブラウザに削除機能を載せても意味が薄い。

### セッション管理

セッションはインメモリの map で管理している。個人用途なのでサーバー再起動で全セッションが消えても問題ない。Redis や DB を持ち出すほどの規模ではないし、シンプルに保てるならそれに越したことはない。

OAuth の state パラメータは CSRF 対策として Single-use にした。生成時に 10 分の有効期限をつけ、callback で照合したら即削除する。

### Web UI

UI は `go:embed` でバイナリに同梱した。HTML と vanilla JS のみで、React や Next.js は使っていない。ドラッグ＆ドロップでアップロードして URL を表示するだけなので過剰な技術はいらない。

アップロード後は URL とファイル名・サイズがテーブルに表示され、copy ボタンで一発コピーできる。ペースト（Cmd+V）にも対応しているのでスクリーンショットを撮ってそのまま貼り付けることもできる。

<table>
<tr><th>/login</th><th>/ui</th></tr>
<tr>
<td>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets.babarot.dev/files/2026/03/23308919cbf429d3.png">
    <source media="(prefers-color-scheme: light)" srcset="https://assets.babarot.dev/files/2026/03/e1a3fa52075c3d90.png">
    <img alt="/login" src="https://assets.babarot.dev/files/2026/03/e1a3fa52075c3d90.png" width="250">
  </picture>
</td>
<td>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets.babarot.dev/files/2026/03/430174e481520658.png">
    <source media="(prefers-color-scheme: light)" srcset="https://assets.babarot.dev/files/2026/03/26f63b8284d46342.png">
    <img alt="/ui" src="https://assets.babarot.dev/files/2026/03/26f63b8284d46342.png" width="250">
  </picture>
</td>
</tr>
</table>



### OAuth 未設定時の挙動

GitHub OAuth の環境変数（`GITHUB_CLIENT_ID` 等）を設定しなければ UI ルートは一切登録されず、従来通りの API 専用モードで動く。既存の運用に影響がないようにした。Smart default として OAuth なしでも動く状態をベースにし、設定を追加することで機能が拡張される形にしている。ローカル開発用には `AUTH_DISABLED=true` で認証をスキップするオプションもつけた。

## デプロイ

NAS 上の `compose.yaml` に環境変数を 3 つ追加するだけで済む。

```yaml
environment:
  # ... 既存の設定
  - GITHUB_CLIENT_ID=${IMAGE_HOSTING_GITHUB_CLIENT_ID}
  - GITHUB_CLIENT_SECRET=${IMAGE_HOSTING_GITHUB_CLIENT_SECRET}
  - GITHUB_ALLOWED_USERS=${IMAGE_HOSTING_ALLOWED_USERS:-babarot}
```

GitHub の [Developer Settings](https://github.com/settings/developers) で OAuth App を作り、callback URL に `https://assets.babarot.dev/auth/callback` を設定する。Client ID と Secret を `.env` に書いて `docker compose up -d` で終わり。

## まとめ

`https://assets.babarot.dev/login` にアクセスして GitHub でログインするとすぐにアップロード画面が出る。ブラウザのタブにファイルを投げ込んで URL をコピーする。より便利になった。

コードはこれ: https://github.com/babarot/image-hosting-server

適当に docker compose up すれば UI が立つので簡単に試せる。
