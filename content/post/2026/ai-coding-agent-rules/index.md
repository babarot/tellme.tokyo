---
title: "CLAUDE.mdとrulesの使い分け、各ツールの対応状況 (2026.3)"
date: "2026-03-12T00:00:00+09:00"
description: ""
categories: []
draft: false
toc: false
---

Claude Code を業務で使い込んでいくうちに、ルールファイルの設計について考えることが増えた。最初は CLAUDE.md に全部書いていたが、セッションが長くなるとルールが守られなくなる場面に何度か遭遇し、ルールの置き場所を見直す必要が出てきた。

この記事では「AI Coding Agent に渡すルールには何を書くべきか」という問いに対する自分の考えと、GitHub Copilot・OpenAI Codex CLI・Claude Code・Cursor・Windsurf など主要ツールの対応状況をまとめる。

## ルールとコンテキストを分ける

AI Coding Agent への指示は大きく2種類に分けられる。

1. **コンテキスト**: プロジェクトの概要、ディレクトリ構成、モジュールの役割など、セッション開始時に把握しておくべき情報
2. **ルール**: コーディングスタイル、命名規約、lint の実行手順、禁止パターンなど、セッション全体を通じて守るべき制約

この2つは性質が異なる。コンテキストはセッションの冒頭で一度伝えれば十分だが、ルールはセッション中のあらゆるタイミングで遵守される必要がある。

Claude Code の場合、この区別は特に重要である。CLAUDE.md の内容は System Prompt ではなく User Message として注入される（[Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)、[GitHub Issue #6973](https://github.com/anthropics/claude-code/issues/6973)）。つまりセッションが進むにつれて古いメッセージになり、ルールの遵守率が下がる。公式の [Memory management](https://code.claude.com/docs/en/memory) ページでも、CLAUDE.md は enforced configuration ではなく context として扱われると明記されている。

だから CLAUDE.md にはコンテキスト情報だけを書き、ルールは `.claude/rules/` に分離する方が実効性が高い。`.claude/rules/` の conditional rules は該当パターンにマッチするファイルを Read したタイミングで注入されるため、セッション後半でもルールが比較的新しいメッセージとして届く。

[Writing a Good AGENTS.md](https://www.philschmid.de/writing-good-agents) では、基盤ドキュメントには概要だけ書き詳細は個別ファイルに分離するアプローチを Progressive Disclosure と呼んでいる。CLAUDE.md と `.claude/rules/` の分離はまさにこれと同じ構造である。

## ルールに何を書くか

では具体的にルールとして定義すべきものは何か。自分が運用してみて効果が高いと感じたものを挙げる。

### コーディングスタイル・命名規約

フォーマッターやリンターで機械的に検出できるものは、そもそもルールに書くより [Hooks](https://code.claude.com/docs/en/hooks) で自動実行した方が確実である（[HumanLayer のブログ](https://www.humanlayer.dev/blog/writing-a-good-claude-md) も同じ指摘をしている）。ただし、リンターでカバーできないプロジェクト固有の規約は書く価値がある。例えば「変数名にはリソースの用途を含める（`main_db` ではなく `user_profile_db`）」「モジュールの input は optional より required を優先する」のような設計方針は、機械的な検出が難しい。

### lint / テスト の実行手順

「commit 前に conftest を実行する」「変更した `.tf` ファイルごとに個別に実行する」のような手順は、ルールとして明示する効果が大きい。Agent は明示しないと省略しがちである。

### 禁止パターン

「`terraform init` はローカルで実行しない」「`git add .` を使わない」「シークレットをハードコードしない」のような禁止事項は、ルールとして書くのに最も適している。やるべきことよりも、やってはいけないことの方が Agent には伝わりやすい。

### アーキテクチャ上の制約

「Cloud Workflows のアプリケーションロジックは `workflows/` ディレクトリに分離する」「コンテナイメージの管理は `xxx-yyy-containers` プロジェクトで行う」のような、コードを読んだだけでは推測しにくい設計上の制約も書くべきである。

### ルールに書くべきでないもの

逆に、以下はルールに書かない方が良い。

- **コードを読めばわかること**: 標準的な言語慣習、フレームワークの使い方
- **プロジェクトの概要や構成**: コンテキスト情報であり、CLAUDE.md / AGENTS.md に書くべきもの
- **頻繁に変わる情報**: ルールは安定した制約を記述する場所である
- **長大な説明やチュートリアル**: ルールは簡潔であるべき

公式の [Best Practices](https://code.claude.com/docs/en/best-practices) でも以下のように述べられている。

> Keep it concise. For each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it.

## Conditional Rules でスコープを絞る

ルールを `.claude/rules/` に分離したら、次に考えるべきは `paths` によるスコープ指定である。

```yaml
---
paths:
  - "terraform/**/*.tf"
---
# Terraform コーディングスタイル
...
```

こう書くと、`terraform/` 配下の `.tf` ファイルを Claude が Read したタイミングでこのルールが注入される。GitHub Actions のルールは `.github/**` に、Kubernetes のルールは `kubernetes/**` にスコープできる。

利点は2つある。

1. **コンテキストの効率化**: 全セッションで全ルールをロードするのではなく、必要なルールだけが必要なタイミングで注入される
2. **注入タイミングの最適化**: 会話が進んだ後半で `.tf` ファイルに触れたとき、その時点で注入されるルールは、セッション冒頭の CLAUDE.md より会話履歴上で近い位置にある。Agent にとっては「最近言われたこと」になるので効きやすい

ただし注意点もある。公式ドキュメントには「`paths` 付きルールは、該当ファイルを読んだときに適用される（not on every tool use）」とあるが、再注入の挙動（2回目以降に同じ条件のファイルを触った場合にどうなるか）は明示されていない。また、Write のみで Read しない場合はトリガーされない既知の制限がある（[GitHub Issue #23478](https://github.com/anthropics/claude-code/issues/23478)）。とはいえ実務上、Agent は書き込み前にファイルを読むことがほとんどなので、大きな問題にはならないはず。

## Co-location とのトレードオフ

ルールを rules ディレクトリに集約すると、co-location が失われる。AGENTS.md なら `terraform/AGENTS.md` のようにコードの近くに置けるが、`.claude/rules/` はプロジェクトルートの1箇所にしか置けない。`paths` で論理スコープは絞れるが、物理的にはコードから離れる。

これは Claude Code に限った話ではない。Cursor の `.cursor/rules/` も Windsurf の `.windsurf/rules/` も、rules ディレクトリ自体はルートに1箇所である。「サブディレクトリ対応」と言っても、rules ディレクトリの中をフォルダで整理できるだけで、`terraform/.cursor/rules/` のようにコードと同じ場所に rules を置けるわけではない。つまり co-location の問題は、ツール固有の rules 機構を使う限りどのツールでも共通して発生する。

AGENTS.md はこの問題を持たない。各ディレクトリに配置でき、コードとルールが同じ場所にある。ただし前述の通り conditional rules（glob パターンでのスコープ指定）の仕組みがない。「ルールの実効性」と「ルールの見通し」のトレードオフであり、プロジェクトの規模やチームの運用に応じた判断が必要になる。

## 各社ツールの対応状況

ここからは主要な AI Coding Agent のルールシステムを比較する。2026年3月時点の状況である。

### GitHub Copilot

Copilot は [custom instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) として3つの指示ファイルを持つ。

- `.github/copilot-instructions.md` — リポジトリ全体の指示
- `.github/instructions/*.instructions.md` — `applyTo` frontmatter で glob パターン指定
- `AGENTS.md` — ディレクトリ階層による指示（最も近いファイルが優先）

`.instructions.md` ファイルは YAML frontmatter で `applyTo` にパターンを書く:

```yaml
---
applyTo: "src/api/**/*.ts"
---
```

Claude Code の `.claude/rules/` と同じ conditional rules の考え方だが、ファイルの配置場所が `.github/instructions/` である点が異なる。

### OpenAI Codex CLI

Codex CLI は `AGENTS.md` をメインの指示ファイル形式として採用している。`~/.codex/AGENTS.md`（個人設定）に加え、Git root からカレントディレクトリまでの各階層にある `AGENTS.md` を走査してマージする（[公式ガイド](https://developers.openai.com/codex/guides/agents-md)）。`AGENTS.override.md` による優先上書きや、fallback filename の設定にも対応している。

glob パターンベースの conditional rules は未対応で、ディレクトリ階層によるスコープのみである。ただしディレクトリ階層の走査は柔軟で、モノレポでもサブディレクトリごとに指示を分けられる。

### Claude Code

前述の通り、`CLAUDE.md` と `.claude/rules/` の2本立て。`paths` による conditional rules に対応している。AGENTS.md のネイティブサポートはないが、`@AGENTS.md` のインポート構文で参照可能である（[GitHub Issue #6235](https://github.com/anthropics/claude-code/issues/6235) がオープンのまま）。

### Cursor

Cursor は `.cursor/rules/*.md` に4種類のルールタイプを持つ（[公式ドキュメント](https://cursor.com/docs/context/rules)）。

- **Always Apply** — 毎セッション適用
- **Apply Intelligently** — Agent が description に基づき関連性を判断して適用
- **Apply to Specific Files** — glob パターンでファイルマッチ時のみ適用
- **Apply Manually** — `@rule-name` でメンション時のみ適用

最も多機能である。特に Apply Intelligently は他のツールにはない仕組みで、description だけをシステムプロンプトに入れ、関連性があると判断した場合にのみ本文を読み込む。ルールの数が増えてもコンテキストを圧迫しにくい設計になっている。

### Windsurf

Windsurf は `.windsurf/rules/*.md` に Cursor と同様の4種類のトリガーを持つ（`always_on` / `model_decision` / `glob` / `manual`）。`AGENTS.md` にも対応しており、ルートのものは always-on、サブディレクトリのものは自動的にそのディレクトリにスコープされる（[公式ドキュメント](https://docs.windsurf.com/windsurf/cascade/memories)）。

### 比較表

| ツール              | メインファイル                           | glob ベースの conditional rules | AGENTS.md 対応 |
| ---------------- | --------------------------------- | :-------------------------: | :----------: |
| GitHub Copilot   | `.github/copilot-instructions.md` |       あり (`applyTo`)        |      あり      |
| OpenAI Codex CLI | `AGENTS.md`                       |             なし              |   あり (メイン)   |
| Claude Code      | `CLAUDE.md` + `.claude/rules/`    |        あり (`paths`)         |  なし (独自形式)   |
| Cursor           | `.cursor/rules/*.md`              |          あり (4タイプ)          |      あり      |
| Windsurf         | `.windsurf/rules/*.md`            |          あり (4タイプ)          |      あり      |
| Cline            | `.clinerules/*.md`                |        あり (`paths`)         |      あり      |
| Roo Code         | `.roo/rules/*.md`                 |           モード固有のみ           |      あり      |
| Zed              | `.rules` + 互換ファイル                 |             なし              |      あり      |

## AGENTS.md という合流点

表を見ると、AGENTS.md が事実上のクロスツール標準になりつつあることがわかる。Copilot、Codex CLI、Cursor、Windsurf、Cline、Roo Code、Zed の7ツールが対応している。Claude Code だけが独自の CLAUDE.md 形式を採用している。

面白いのは、AGENTS.md にはルールの conditional な適用を定義する仕組みがないことである。AGENTS.md のスコープはディレクトリ階層に依存するが、その扱いはツールによって異なる。Copilot や Codex CLI はサブディレクトリの AGENTS.md を階層的に探索する。Cursor もサブディレクトリの AGENTS.md に対応している。Roo Code は workspace root の AGENTS.md のみを読み込む（[Roo Code Docs](https://docs.roocode.com/features/custom-instructions)）。一方、各ツール固有のルールファイル（`.claude/rules/`、`.cursor/rules/`、`.windsurf/rules/`）は glob パターンベースの条件指定に対応している。

つまり現時点での実用的な構成は以下のようになる:

- **AGENTS.md**: プロジェクトのコンテキスト情報（概要・構成）を記述。どのツールでも読まれるクロスツール互換のレイヤー。ただしサブディレクトリへの配置はツールによって対応が異なるため、ルートへの配置が最も安全である
- **各ツール固有の rules ディレクトリ**: ルール（コーディングスタイル、lint 手順、禁止事項）を conditional rules として記述。ツール固有だがスコープ制御が効く

コンテキストとルールの分離は、単に Claude Code のベストプラクティスというだけでなく、クロスツール運用の観点からも理にかなっている。

## まとめ

- ルールとコンテキストは性質が異なるので分けて管理する
- コンテキスト（概要・構成）は CLAUDE.md / AGENTS.md に書く
- ルール（コーディングスタイル・lint 手順・禁止事項）は `.claude/rules/` に `paths` 付きで書く
- conditional rules は glob パターンでスコープを絞ることで、必要なタイミングで注入される
- AGENTS.md がクロスツール標準になりつつあるが、conditional rules は各ツール固有の仕組みに依存する

AI Coding Agent のルールシステムはまだ発展途上で、ツールごとに仕様が異なる。ただ、「コンテキストとルールを分ける」「ルールはスコープを絞って必要なときに渡す」という設計原則はツールに依存しない。この原則を押さえておけば、ツールが変わっても応用が効くと思う。

## 参考

- [Memory management - Claude Code Docs](https://code.claude.com/docs/en/memory)
- [Best Practices - Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)
- [OpenAI Codex CLI AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md)
- [Cursor Rules](https://cursor.com/docs/context/rules)
- [Windsurf Memories](https://docs.windsurf.com/windsurf/cascade/memories)
- [Writing a good CLAUDE.md - HumanLayer Blog](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Writing Good AGENTS.md - Phil Schmid](https://www.philschmid.de/writing-good-agents)
