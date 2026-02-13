---
title: "自宅 NAS を S3 っぽい画像ホスティングにして Obsidian から使う"
date: "2026-02-08T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---

Obsidian でノートを書いているとき、画像の管理が地味に面倒だった。スクリーンショットを貼り付けるとローカルの vault に画像ファイルが溜まっていく。Obsidian Sync は高速だが何年も vault を運用していくとメディアファイルが増大して同期が重くなるし、そもそも vault の中にバイナリファイルが散らばるのが気持ち悪い。Imgur のような外部サービスに上げる手もあるが、個人のノートの画像を他所に預けるのは心理的に抵抗がある。GCS や S3 を使えば確実に解決するが、個人の画像置き場のために月額料金を払い続けるのも微妙かなと。

自宅に Synology NAS（DS923+）がある。HDD の容量はかなり余っている。以前から NAS でデータ管理をしていて [^1]、Docker も動かせるし自分でアプリを書いてデプロイもしている。これを GCS/S3 みたいなクラウドストレージサービスとして使えないか？と考えた。Obsidian に画像を貼り付けたら自動的に NAS にアップロードされて、Markdown に公開 URL が挿入されて、どこからでもその画像が見える、というような感じ。GCS にオブジェクトを置いて公開 URL で参照するのと同じで、ストレージがパブリッククラウドではなく自宅の NAS というだけ。

[^1]: NAS の導入についてはこちら: [家のNAS環境](https://tellme.tokyo/post/2025/01/05/nas/)

## Cloudflare Tunnel で NAS を公開する

これを実現するうえで最大の制約は NAS を直接インターネットに晒したくないということだった。ポートフォワーディングで外からアクセスさせたくないし、自宅の IP を公開したくないし、DDoS を受けたら NAS ごと死ぬ。Tailscale で VPN は張っているが、これはあくまで自分用であってブログに貼った画像を誰でも見れるようにするには使えない。パブリックにアクセスできる URL が必要だ。

そこで [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) を使うことにした。NAS 側から Cloudflare に向けてトンネルを掘ると、外からのリクエストはすべて Cloudflare を経由するようになる。NAS の IP は隠蔽されるし、DDoS は Cloudflare が吸収するし、ポート開放は一切不要。NAS が自分から外に手を伸ばしてトンネルを維持する構成なのでルーターの設定を触る必要もない。

NAS 上には Go で書いた API サーバーを Docker で動かしていて、cloudflared と同じ compose にまとめている。

```yaml
# compose.yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    network_mode: host

  upload-api:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - ${UPLOAD_DIR}:/data/files
    environment:
      - API_KEY=${API_KEY}
      - UPLOAD_DIR=/data/files
      - BASE_URL=${BASE_URL:-https://assets.babarot.dev}
      - LISTEN_ADDR=:8080
```

`127.0.0.1:8080` にバインドしているので LAN 内からも直接アクセスできない。すべてのトラフィックは Cloudflare Tunnel 経由。NAS に SSH して `docker compose up -d --build` すれば終わりで、Cloudflare ダッシュボードで Tunnel のステータスが「正常」になれば開通している。

## API と構成

```
[Obsidian]
    │  画像を貼り付け
    ↓
[Image Uploader Plugin]
    │  POST assets.babarot.dev/api/upload
    ↓
[Cloudflare Edge]
    │  DDoS防御, WAF, CDN キャッシュ
    ↓  Tunnel (暗号化)
[Upload API (Go, Docker on NAS)]
    │
    ├─ アップロード → NAS のディスクに保存
    └─ 配信 → GET /files/... で静的ファイルを返却
```

API がやっていることはシンプルで、ファイルを受け取ってディスクに書き、公開 URL を返すだけ。ファイルは `/files/YYYY/MM/{random}.{ext}` というパスで保存される。ファイル名は暗号学的乱数の 16 文字 hex で、URL を知らない限りたどり着けない。GCS/S3 の公開バケットと同じモデルだ。上書きは不可（immutable）で、差し替えたければ削除して再アップロードする。DB は使わずファイルシステムが唯一の truth。`Cache-Control: public, max-age=31536000, immutable` を返すので Cloudflare CDN に長期キャッシュされて NAS への負荷も最小限になる。

API のコードはここ: https://github.com/babarot/image-hosting-server

セキュリティは個人利用とはいえ一応多層で考えた。Cloudflare Edge の DDoS 吸収と WAF、API Key 認証（constant-time compare）、IP ごとの Rate Limiting、アップロード時の拡張子と MIME sniffing の二重チェック。配信側（`/files/*`）はパブリック公開だがファイル名がランダムなので URL を知らなければ到達できない。

## Obsidian から画像を貼るだけ

Obsidian 側では画像を貼り付けたときに自動でアップロードして URL を挿入してくれるプラグインが必要になる。いくつか調べたのだけど、[Image Uploader](https://github.com/Creling/obsidian-image-uploader)（by Creling）がシンプルかつカスタム API に対応していてちょうどよかった。PicGo を経由するやつとか専用の Gateway サーバーが前提のやつもあったがオーバースペックだった。

設定はこれだけ。

| 設定項目 | 値 |
|---|---|
| Api Endpoint | `https://assets.babarot.dev/api/upload` |
| Upload Header | `{"X-API-Key": "<APIキー>"}` |
| Upload Body | `{"file": "$FILE"}` |
| Image Url Path | `url` |

これで Obsidian 上でスクリーンショットを Cmd+V で貼り付けると、Image Uploader が画像をインターセプトして API にアップロードし、返ってきた URL を `![](https://assets.babarot.dev/files/2026/02/...)` として Markdown に挿入してくれる。めちゃくちゃ快適。

![](https://assets.babarot.dev/files/2026/02/67fdd0e4f74a2f52.png)

curl からも普通に使える。そのため既存のメディアファイルたちをまとめて NAS に移行するのもスクリプトを書けば簡単に出来そうなのも良い。

```bash
$ curl -X POST -H "X-API-Key: $KEY" -F "file=@screenshot.jpg" \
  https://assets.babarot.dev/api/upload


{"filename":"2df20bfac0b76347.jpg",
 "path":"2026/02/2df20bfac0b76347.jpg",
 "size":33404,
 "url":"https://assets.babarot.dev/files/2026/02/2df20bfac0b76347.jpg"}
```


## おわりに

ポート開放なし、NAS の IP は隠蔽、Cloudflare CDN でキャッシュされるので NAS への負荷は最小限。自宅の 30+TB HDD を GCS のように使える環境が整った。画像の置き場に困ることはもうないし月額料金もかからない。NAS を持っていて画像管理に困っている人にはかなりおすすめできる構成だと思う。