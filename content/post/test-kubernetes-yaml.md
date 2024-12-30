---
title: "Kubernetes などの YAML を独自のルールをもとにテストする"
date: "2019-02-19T21:40:24+09:00"
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: ""
tags:
- kubernetes
- go
- stein
- yaml
---

<img width="878" alt="2019-01-24 23 58 36" src="https://user-images.githubusercontent.com/4442708/51686626-112c1280-2034-11e9-81b1-ac77b253ab2e.png">

## 設定ファイルのメンテナンスの必要性

Infrastructure as Code の普及もありインフラの状態やその他多くの設定が、設定ファイル言語 (YAML や HCL など) で記述されることが多くなった。
Terraform HCL や Kubernetes YAML など、人が継続的にメンテナンスしなければならなく、その設定が直接プロダクションに影響を与える場合、そのレビューがとても重要になる。
具体的に例えば、「デプロイする Replica の数」や「Resource limit や PodDisruptionBudget が適切か」などレビューの中で注意深く見なけれなならない点などがあげられる。
加えて日々のレビューの中で、問題にはならないが「Kubernetes の metadata.namespace は省略できるけど事故防止の意味も込めて明示的に書きましょう」といった設定ファイルに対して強制させたいポリシーなどが生まれて、ひとつのレビュー観点になっていくことは自然である。

人がレビューの中で毎回見なければならないこと、毎回指摘すること、機械的にチェックできることはルールセットを定義して、それをもとに lint でチェックして CI で失敗させるのが効率的である。

YAML などのただの設定ファイル言語に対して「独自のルールを定義してそれをもとにテストする」ということは実は難しかったりする。

- [garethr/kubeval: Validate your Kubernetes configuration files, supports multiple Kubernetes versions](https://github.com/garethr/kubeval)
- [viglesiasce/kube-lint: A linter for Kubernetes resources with a customizable rule set](https://github.com/viglesiasce/kube-lint)

kubeval はマニフェストファイルの validator として機能する。例えば、integer として定義しなければいけないフィールドを string で定義していた場合に検知することができる。
kube-lint は決められた Kind (現在は Pod のみ) の決められたフィールドのチェックを決められたオペレータ (equal, not equal など) で違反していないかチェックすることができる。

あくまでも「このファイルのこの部分はこのように定義されているべきである」というルール作りに特化したツールはなかった。

## 独自のルールをもとにテストする

そこで次のツールを Terraform と [HashiCorp Sentinel](https://www.terraform.io/docs/enterprise/sentinel/index.html) から着想を得て作った。

[b4b4r07/stein: A linter for config files with a customizable rule set](https://github.com/b4b4r07/stein/)

HashiCorp Sentinel は HashiCorp が提唱する [Policy as Code](https://docs.hashicorp.com/sentinel/concepts/policy-as-code) を実装したツールになっている。
要するに、「インフラの状態を設定ファイルとしてコードで書くように、設定ファイルの状態をポリシーとしてコードで書く」、という考え方でありそれを実践できるツールである。

```go
main = rule {
  all tfplan.resources.aws_instance as _, instances {
    all instances as _, r {
      (length(r.applied.tags) else 0) > 0
    }
  }
}
```

上の Sentinel のポリシー例は AWS インスタンスのタグ指定がされているかどうかをルールとして定義したものになっている。

一方で、Stein では例えば次のようなポリシーをコードとして書けるようになっている。

- metadata.namespace は指定されているか
- `<namespace>/development` でディレクトリを切ってマニフェストを置いているとき、metadata.namespace は `<namespace>-dev` になっているか
- ファイル名は metadata.name に `.yaml` をつけたものになっているか
- マニフェストの拡張子に `.yml` はないか
- 1ファイルにつき、1リソースの定義になっているか
- Deployemnt が定義されているとき PodDisruptionBudget も同様に定義されているか
- etc

こうしたポリシーは会社やそのチームの方針によって異なる。
こういったことからさまざまなユースケースをカバーするポリシーを定義するときは、ツール側で自由にルールを定義できるような機能を提供していなければならない。
上の例で示したように、Sentinel では [Sentinel Language](https://docs.hashicorp.com/sentinel/language/) という専用言語を用いてルールを定義できるようにしている。

Stein では Terraform のように HCL で定義できるようにしている。

```hcl
rule "replicas" {
  description = "Check the number of replicas is sufficient"

  conditions = [
    "${jsonpath("spec.replicas") > 3}",
  ]

  report {
    level   = "ERROR"
    message = "Too few replicas"
  }
}
```

Terraform の [resource](https://www.terraform.io/docs/configuration/resources.html) ブロックのように Stein 内で識別される [rule](https://b4b4r07.github.io/stein/configuration/policy/rules/) というブロックを提供している。
この中でルールを定義していく。
Stein では **rule の conditions にある評価式が一つでも false になった場合、rule が fail して report にもとづいてエラーが返る** ようになっている。
上の例では、spec.replicas が 3 以上を満たさない場合、この rule が失敗し標準出力にレポートされる。

```bash
$ stein apply
manifests/microservices/x-echo-jp/development/Deployment/test.yaml
  [ERROR]  rule.replicas            Too few replicas
```

各要素へのアクセス (spec.replicas) は [JSONPATH 形式](https://kubernetes.io/docs/reference/kubectl/jsonpath/)で jsonpath 関数によって提供される。
jsonpath 関数は Stein が提供する組み込み関数になっている。
Stein では Terraform のように組み込み変数や組み込み関数を提供している。

[Interpolation Syntax - Stein Documentations](https://b4b4r07.github.io/stein/configuration/syntax/interpolation/)

その他、Terraform が提供している Interpolation をインポートしているので、例えば format 関数や lookup 関数なども使うことができる。

## Stein を使う

Stein を使うことで自由なルールをポリシーとして定義して、それをもとにテスト実行することができるようになる。
HCL ベースとはいえ、Terraform のように少しの学習コストがあるので提供しているスキーマの使い方を示す。

その前に、Stein のインターフェースを示すと、Stein は CLI コマンドとして動作する。

```bash
$ stein --help
Usage: stein [--version] [--help] <command> [<args>]

Available commands are:
    apply    Applies a policy to arbitrary config files.
    fmt      Formats a policy source to a canonical format.

```

apply と fmt をサブコマンドとして持つ。
apply は定義されたポリシーを元に引数に渡された YAML などに対してチェックを実行する。
fmt は HCL のフォーマットチェックができる。

ポリシーファイルは HCL で定義し、任意のディレクトリに置くことができる。

```bash
$ stein apply -policy rule.hcl manifests/microservices/x-echo-jp/development/Deployment/test.yaml
```

```bash
$ export STEIN_POLICY=rule.hcl
$ stein apply manifests/microservices/x-echo-jp/development/Deployment/test.yaml
```

apply のフラグで指定するか環境変数で指定することができる。ちなみにカンマ区切りで複数指定できるので、Terraform のように自由な単位でファイル分割ができる。

また、`.policy` ディレクトリをデフォルトのポリシーファイル置き場として認識するのでその場合は指定しなくて良い。
`.policy` が認識されるのは引数に渡されたファイルが置かれているディレクトリの階層すべて、になる。
上の例だと次のディレクトリが対象になる。

```bash
manifests/.policy/
manifests/microservices/.policy/
manifests/microservices/x-echo-jp/.policy/
manifests/microservices/x-echo-jp/development/.policy/
manifests/microservices/x-echo-jp/development/Deployment/.policy/
```

このおかげで影響させるポリシーをディレクトリで指定することができるようになっている。
より詳細な挙動と実際の例は公式ドキュメントとリポジトリにあるサンプルが参考になる。

- [Load Order - Stein Documentations](https://b4b4r07.github.io/stein/configuration/load/)
- [stein/_examples at master · b4b4r07/stein](https://github.com/b4b4r07/stein/tree/master/_examples)

次に DSL の書き方について示す。

```hcl
rule "namespace_name_irregular" {
  description = "Check namespace name is valid"

  // (省略できる)
  // このルールが依存するルールを書くことができる
  // この場合、rule.namespace_specification が失敗した場合このルールは apply されない
  depends_on = ["rule.namespace_specification"]

  // (省略できる)
  // このルールを apply するにあたって満たすべき評価式を指定できる
  // cases をすべて満たすとき、このルールが apply される
  precondition {
    cases = [
      "${is_irregular_namespace_pattern()}",
    ]
  }

  // (必須)
  // apply したときにこのルールを成功させるか失敗させるかを決める
  // ひとつでも false が返ったとき、このルールは失敗する
  conditions = [
    "${contains(lookuplist(var.namespace_name_map, jsonpath("metadata.namespace")), get_service_id_with_env(filename))}",
  ]

  // (必須)
  // ルールが失敗したときのレポートフォーマットを指定できる
  // ERROR の場合、stein の終了値は 1 になり、WARN のときはエラー表示はされるが終了値は 0 になる
  report {
    level   = "ERROR"
    message = "${format("This case is irregular pattern, so %q is invalid", jsonpath("metadata.namespace"))}"
  }
}

// Terraform の変数定義と同じ
variable "namespace_name_map" {
  type = "map"

  default = {
    "gateway" = [
      "x-gateway-jp-dev",
      "x-gateway-jp-prod",
    ]
  }
}

// ユーザ定義関数を定義できる
function "get_service_name" {
  params = [file]
  result = basename(dirname(dirname(dirname(file))))
}

function "get_env" {
  params = [file]
  result = basename(dirname(dirname(file)))
}

function "get_service_id_with_env" {
  params = [file]
  result = format("%s-%s", get_service_name(file), lookup(var.shortened_environment, get_env(file)))
}
```

これ以外にも機能があるが長くなってしまうので省略する。
他の使い方やユースケースなどは公式ドキュメントとしてまとめているので参考になるかもしれない。

[Stein Documentations](https://b4b4r07.github.io/stein/)

また、リポジトリにある [_examples](https://github.com/b4b4r07/stein/tree/master/_examples) ディレクトリは実際のユースケースに則した形でのせたのでこれも参考になる。

```bash
$ tree -a _examples
_examples
├── .policy/
│   ├── config.hcl
│   ├── functions.hcl
│   ├── rules.hcl
│   └── variables.hcl
├── manifests/
│   ├── .policy/
│   │   ├── functions.hcl
│   │   └── rules.hcl
│   └── microservices/
│       ├── x-echo-jp/
│       │   └── development/
│       │       ├── Deployment/
│       │       │   ├── redis-master.yaml
│       │       │   ├── test.yaml
│       │       │   └── test.yml
│       │       ├── PodDisruptionBudget/
│       │       │   └── pdb.yaml
│       │       └── Service/
│       │           └── service.yaml
│       └── x-gateway-jp/
│           └── development/
│               └── Deployment/
│                   └── test.yaml
└── spinnaker/
    ├── .policy/
    │   └── functions.hcl
    └── x-echo-jp/
        └── development/
            └── deploy-to-dev-v2.yaml
```

```bash
# _examples にある例をもとに stein を実行する
$ make run
```

## まとめ

本記事では、

- YAML などの設定ファイル言語のメンテナンスと Policy as Code の重要性
- Sentinel から着想を得て Policy as Code を実践するツールとして Stein の説明
- Stein を使った設定ファイルに対するテストと使い方

について書いた。

実際にこれらを本番環境に導入する際には CI で実行させるといいと思う。
その際に、その P-R で変更された YAML ファイルのみに対して stein を実行する、というアプローチを取ると良い。

[Stein Documentations](https://b4b4r07.github.io/stein/)
