---
title: "Docker Compose のマルチファイル構成で dev/prod を切り替える"
date: "2026-03-12T00:00:00+09:00"
description: ""
categories: []
draft: true
toc: false
---

Docker Compose で複数のサービスを束ねて動かすとき、開発環境と本番環境の差分をどう管理するかは地味に悩ましい。自分はここしばらく「base + overlay」のマルチファイル構成に落ち着いていて、個人プロジェクトではこのパターンをよく使っている。

## よくある構成とその不満

Docker Compose で dev/prod を分ける方法はいくつかある。

1. **環境変数で分岐する** — `.env.dev` と `.env.prod` を切り替える。シンプルだが、環境変数だけでは表現しきれない差分がある。build target の切り替え、サービスの追加・削除、volume のマウント先の変更などは環境変数では吸収できない
2. **compose ファイルを丸ごと2つ用意する** — `compose.dev.yaml` と `compose.prod.yaml` を完全に別ファイルにする。確実だが、共通部分が重複して保守が面倒になる。片方を変更したらもう片方も追従しないといけない
3. **1ファイルに全部書いて profile で切り替える** — Compose の `profiles` 機能を使う。dev-only のサービスに `profiles: [dev]` をつけて `--profile dev` で起動する。サービス単位の出し分けには向いているが、同じサービスの設定値を環境ごとに変えたい場合には使えない

どれも一長一短で、結局のところ「共通部分は1箇所に書きたい」「環境固有の差分だけ別で持ちたい」という要求を素直に満たすのが Docker Compose のマルチファイル機能だった。

## base + overlay の構成

Docker Compose は `-f` フラグで複数のファイルを指定すると、後から指定したファイルの内容で前のファイルをマージ（上書き）する。これを使って `compose.yaml`（base/dev）と `compose.prod.yaml`（overlay）の2ファイル構成にする。

```
.
├── compose.yaml          # base（開発環境のデフォルト値を持つ）
├── compose.prod.yaml     # overlay（本番環境の差分だけ）
├── Dockerfile
└── Makefile
```

開発時は `compose.yaml` だけで起動する。本番では2つを重ねる。

```bash
# dev
docker compose up

# prod
docker compose -f compose.yaml -f compose.prod.yaml up -d --build
```

これだけだ。Makefile に薄くラップしておけば普段は `make dev` と `make prod` で済む。

## 実例

自分が運用している RSS リーダー（[oksskolten](https://github.com/babarot/oksskolten)）の構成を例に説明する。server、frontend、MeiliSearch、RSS-Bridge、FlareSolverr の5サービスに加えて、本番では Cloudflare Tunnel 用の cloudflared が加わる構成だ。

### compose.yaml（base）

base ファイルには開発環境として動く完全な定義を書く。このファイルだけで `docker compose up` すれば開発環境が立ち上がる状態にしておくのがポイントだ。

```yaml
services:
  server:
    build:
      context: .
      target: dev                    # Dockerfile の dev ステージ
    command: npm run dev:server      # ホットリロード
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: file:/data/rss.db
      MEILI_URL: http://meilisearch:7700
    env_file:
      - path: .env
        required: false
    volumes:
      - .:/app                       # ソースをマウント（ホットリロード用）
      - server_node_modules:/app/node_modules
      - ${DATA_DIR:-./data}:/data
    ports:
      - "3000:3000"                  # ホストに直接公開
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      meilisearch:
        condition: service_healthy

  frontend:
    build:
      context: .
      target: dev
    command: npm run dev -- --host 0.0.0.0 --port 5173
    ports:
      - "5173:5173"

  meilisearch:
    image: getmeili/meilisearch:v1.13
    ports:
      - "7700:7700"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 5s
      timeout: 3s
      retries: 10

  rss-bridge:
    image: rssbridge/rss-bridge:latest
    ports:
      - "8080:80"

  # ... 他のサービスも同様
```

開発環境では全サービスのポートをホストに公開している。`target: dev` で Dockerfile の開発用ステージを使い、ソースコードをマウントしてホットリロードを効かせる。

### compose.prod.yaml（overlay）

overlay ファイルには本番環境での差分だけを書く。base と同じキーを書けばその値で上書きされる。

```yaml
services:
  server:
    build:
      target: runtime                # 本番用ステージに切り替え
    command: []                      # Dockerfile の ENTRYPOINT を使う
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    volumes:
      - ${DATA_DIR:-./data}:/data    # ソースマウントを消してデータだけ
    ports: !override []              # ホストへのポート公開を消す
    expose:
      - "3000"                       # コンテナ間通信のみ

  meilisearch:
    environment:
      MEILI_ENV: production
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    ports: !override []

  rss-bridge:
    ports: !override []

  frontend:
    deploy:
      replicas: 0                    # 本番では frontend コンテナ不要

  cloudflared:                       # 本番でのみ追加されるサービス
    image: cloudflare/cloudflared
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${TUNNEL_TOKEN}
    restart: unless-stopped
```

ここでやっていることを整理する。

**build target の切り替え。** Dockerfile に `dev` と `runtime` の2つのステージを用意しておき、overlay で `target: runtime` に切り替える。dev ステージはソースマウントとホットリロード前提、runtime ステージはビルド済みバイナリだけを含む軽量イメージだ。

**ポートの閉塞。** `ports: !override []` で base の `ports` 定義を完全に消す。`!override` は Compose v2.24.0 で導入された YAML タグで、通常のマージ（追加）ではなく置換を指示する。これがないと base の ports に overlay の ports が追加されるだけで、消すことができない。本番ではすべてのサービスのポートを閉じて、外部アクセスは cloudflared 経由のみにしている。

**サービスの無効化。** `replicas: 0` で frontend コンテナを停止する。本番ではビルド済みの静的ファイルを server が配信するので frontend の dev server は不要だ。

**サービスの追加。** cloudflared は overlay にだけ定義する。開発時には存在しないサービスが、本番でだけ追加される。

**環境変数のオーバーライド。** `NODE_ENV` を `production` に変え、`MEILI_MASTER_KEY` のような本番固有のシークレットを `${...}` で注入する。

### Makefile

最後に Makefile で薄くラップする。

```makefile
COMPOSE ?= docker compose

dev:
	$(COMPOSE) up

prod:
	$(COMPOSE) -f compose.yaml -f compose.prod.yaml up -d --build

prod-down:
	$(COMPOSE) -f compose.yaml -f compose.prod.yaml down
```

`make dev` は base だけ、`make prod` は base + overlay。これ以上のことは何もしていない。

## マージのルール

このパターンを使う上で知っておくべきマージの挙動を整理しておく。

- **スカラー値**（文字列、数値、bool）は後勝ち。overlay で `NODE_ENV: production` と書けば base の `NODE_ENV: development` を上書きする
- **マッピング**（environment、labels など）は再帰的にマージされる。base に `A: 1, B: 2`、overlay に `B: 3, C: 4` があれば結果は `A: 1, B: 3, C: 4`
- **シーケンス**（ports、volumes など）はデフォルトで追加される。base に `"3000:3000"` があって overlay に `"3001:3001"` を書くと、両方が残る。これが直感に反するケースがあり、ポートを消したいときには `!override` が必要になる
- **サービスの追加**は overlay に新しいサービスを書くだけでよい。削除は `replicas: 0` で対応する

`!override` は比較的新しい機能で、これがなかった頃はポートを消すためにシーケンスの上書きができず、結局 `compose.override.yaml` や profile で回避するしかなかった。この機能のおかげで overlay パターンが格段に使いやすくなった。

## バリエーション: 3ファイル構成

oksskolten の2ファイル構成は「base = dev」という割り切りだった。base ファイルに開発環境の値をハードコードしているので、`docker compose up` だけですぐ開発が始められる。シンプルで気に入っているが、プロジェクトが大きくなると開発環境にも固有のサービスやツールが増えてきて、base に全部入れるのが窮屈になることがある。

別のプロジェクト（[minitube](https://github.com/babarot/minitube)、自宅の動画配信サーバー）ではこの問題にぶつかったので、3ファイル構成にしている。

```
.
├── compose.yaml              # 全環境共通の base
├── compose.override.yaml     # dev 固有の差分
├── compose.prod.yaml         # prod 固有の差分
└── Makefile
```

ここで使っているのが `compose.override.yaml` の自動読み込みという Compose の挙動だ。`docker compose up` を実行したとき、Compose は `compose.yaml` に加えて `compose.override.yaml` が同じディレクトリにあれば自動的にマージする。`-f` の指定は不要。つまり開発者は何も意識せず `docker compose up` するだけで base + dev overlay が適用される。

一方、本番では `-f` で明示的にファイルを指定する。

```bash
# dev（compose.yaml + compose.override.yaml が自動マージ）
docker compose up

# prod（compose.yaml + compose.prod.yaml を明示指定、override は読まれない）
docker compose -f compose.yaml -f compose.prod.yaml up -d --build
```

`-f` を指定した時点で自動読み込みは無効になるので、`compose.override.yaml` の dev 設定が本番に混入する心配はない。

### 何を3層目に切り出すか

minitube の場合、dev overlay には以下のようなものが入っている。

```yaml
# compose.override.yaml - 開発環境にのみ適用
services:
  swagger-ui:                              # API ドキュメント（dev only）
    image: swaggerapi/swagger-ui
    ports:
      - "8081:8080"

  backend:
    build:
      dockerfile: cmd/server/Dockerfile.dev  # air でホットリロード
    volumes:
      - ./backend:/app                       # ソースマウント

  frontend:
    build:
      dockerfile: Dockerfile.dev             # Vite dev server
    volumes:
      - ./frontend:/app

  seed:                                    # テストデータ投入（dev only）
    profiles:
      - seed

  redisinsight:                            # Redis GUI（dev only）
    image: redislabs/redisinsight:1.14.0
    ports:
      - "8099:8001"
```

swagger-ui、seed、redisinsight は開発時にしか使わないサービスだ。これらを base に入れてしまうと `replicas: 0` で本番で消す必要が出てくるし、base ファイルが肥大化する。dev overlay に隔離しておけば base は本当に共通の定義だけになる。

prod overlay はこうなっている。

```yaml
# compose.prod.yaml - 本番環境にのみ適用
services:
  nginx:
    volumes:
      - frontend-dist:/usr/share/nginx/html:ro    # ビルド済み静的ファイル
      - ./infra/nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      frontend-builder:
        condition: service_completed_successfully

  frontend-builder:                               # ビルドだけして終了するコンテナ
    build:
      context: ./frontend
      target: builder
    command: sh -c "cp -r /app/dist/* /dist/"
    volumes:
      - frontend-dist:/dist
```

開発時は Vite の dev server がリクエストを処理するが、本番では frontend-builder がビルドした静的ファイルを nginx が配信する。この切り替えを overlay で表現している。

### 2ファイルと3ファイル、どちらを選ぶか

判断基準はシンプルで、**dev 固有のサービスやツールがあるかどうか**だ。

2ファイル構成（base = dev + prod overlay）が向いているケース:
- 開発と本番でサービス構成がほぼ同じ
- 差分が環境変数、ポート、build target くらい
- dev 固有のツール（swagger-ui、DB GUI など）がない

3ファイル構成（共通 base + dev overlay + prod overlay）が向いているケース:
- 開発時にしか使わないサービスが複数ある
- 開発と本番で Dockerfile 自体が異なる（`Dockerfile.dev` vs `Dockerfile`）
- base ファイルを環境中立に保ちたい

自分の場合、小さめのプロジェクト（oksskolten）は2ファイル、大きめのプロジェクト（minitube）は3ファイルにしている。最初は2ファイルで始めて、dev 固有の設定が増えてきたら `compose.override.yaml` を切り出す、という段階的な移行でも全く問題ない。

## マージのルール

このパターンを使う上で知っておくべきマージの挙動を整理しておく。

- **スカラー値**（文字列、数値、bool）は後勝ち。overlay で `NODE_ENV: production` と書けば base の `NODE_ENV: development` を上書きする
- **マッピング**（environment、labels など）は再帰的にマージされる。base に `A: 1, B: 2`、overlay に `B: 3, C: 4` があれば結果は `A: 1, B: 3, C: 4`
- **シーケンス**（ports、volumes など）はデフォルトで追加される。base に `"3000:3000"` があって overlay に `"3001:3001"` を書くと、両方が残る。これが直感に反するケースがあり、ポートを消したいときには `!override` が必要になる
- **サービスの追加**は overlay に新しいサービスを書くだけでよい。削除は `replicas: 0` で対応する

`!override` は比較的新しい機能で、これがなかった頃はポートを消すためにシーケンスの上書きができず、結局 `compose.override.yaml` や profile で回避するしかなかった。この機能のおかげで overlay パターンが格段に使いやすくなった。

## いつこのパターンを使うか

この構成が効くのは、開発環境と本番環境で「同じサービス群を微妙に違う設定で動かす」ケースだ。自分の場合は以下のような差分がある。

- build target（dev vs runtime）
- ポート公開の有無
- 環境変数（development vs production）
- ホットリロード用のソースマウント
- 本番でのみ必要なサービス（cloudflared）
- 本番では不要なサービス（frontend dev server）
- 開発でのみ必要なツール（swagger-ui、redisinsight）

逆に、サービスが1つしかないような単純な構成では Compose 自体が不要な場合もある。Dockerfile と `docker run` で十分だし、環境変数の切り替えだけなら `.env` ファイルで済む（実際、[image-hosting-server](https://github.com/babarot/image-hosting-server) ではサービスが1つだけなので Compose を導入しかけてやめた）。マルチファイル構成はあくまで複数サービスの構成管理に複雑さがあるときに効いてくるパターンだ。

## まとめ

`compose.yaml` に共通の定義を書き、環境固有の差分を overlay ファイルで重ねる。2ファイル（base = dev + prod overlay）で始めて、dev 固有の設定が増えたら3ファイル（共通 base + dev override + prod overlay）に発展させる。`docker compose -f compose.yaml -f compose.prod.yaml up` で重ねるだけの単純な仕組みだが、共通部分の重複を排除しつつ環境ごとの差分を明示的に管理できるので、個人プロジェクトの規模感にちょうど良いと感じている。
