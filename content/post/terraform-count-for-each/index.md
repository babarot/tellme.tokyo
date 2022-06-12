---
title: "Terraform の count と for_each の使い分けと Splat Expressions について"
date: "2022-06-12T00:03:43+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
image: ""
tags: ["terraform"]
---

## count と for_each

Terraform には "繰り返す" 処理として [count](https://www.terraform.io/language/meta-arguments/count) と [for_each](https://www.terraform.io/language/meta-arguments/for_each) がある。

```hcl
resource "aws_instance" "server" {
  count = 4 # create four similar EC2 instances

  ami           = "ami-a1b2c3d4"
  instance_type = "t2.micro"

  tags = {
    Name = "Server ${count.index}"
  }
}
```

```hcl
resource "aws_iam_user" "the-accounts" {
  for_each = toset( ["Todd", "James", "Alice", "Dottie"] )
  name     = each.key
}
```

どちらも for ループとして利用できるが count はリソースが配列として作成され、for_each はリソースがマップとして作成される。for_each に配列を渡す場合は明示的に [`toset`](https://www.terraform.io/language/functions/toset) で [Set](https://www.terraform.io/language/expressions/type-constraints#collection-types) (重複する値がないことが保証された配列) に変換して渡す必要がある (Map はそのまま渡す)。

```hcl
# for_each に Map を渡す
resource "azurerm_resource_group" "rg" {
  for_each = {
    a_group = "eastus"
    another_group = "westus2"
  }
  name     = each.key
  location = each.value
}
```

for_each では要素は [each](https://www.terraform.io/language/meta-arguments/for_each#the-each-object) というオブジェクトで参照する。Map の場合は、each.key と each.value で、配列 (Set) の場合は、each.key と each.value のどちらを使っても要素を参照できる。

## count と for_each の使い分け

**基本的に count を使用しない**。count だとリソースのアドレス (state) が配列となり、途中のリソースを削除するとその index が飛ぶので Terraform が配列の詰め直しをしてしまう。それにより、リソースの削除と作成が行われてしまい予期せぬアクシデントを引き起こす可能性がある。

例えば、次のようなリソースの定義があるとする。[google_project_service](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project_service) は指定した GCP プロジェクトで使用するサービスの API を有効化するリソースである。


```hcl
variable "gcp_enabled_services" {
  type = list(string)

  default = [
    "bigquery.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "iam.googleapis.com",
    "...",
  ]
}

resource "google_project_service" "api" {
  count = length(var.gcp_enabled_services)

  project = google_project.service.project_id
  service = var.gcp_enabled_services[count.index]
}
```

ここで、例えば BigQuery を使わなくなったとして、variable の配列から削除すると以降の index が詰め直しによりリソースの再作成が行われてしまう。それにより、一時的にサービスが無効化され利用できなくなる可能性がある。Cloud SQL の API が disable され通信できなくなるなど想像するとおぞましい。

(ちなみに [google_project_service](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project_service) には [disable_on_destroy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project_service#disable_on_destroy) という Argument がある。True だと、リソースの削除のときにサービスを無効化する。これを false にすることで Terraform から無効化することを防ぐことができる。デフォルトは True)

```console
$ terraform state list
module.myservice.google_project_service.api[0]  # <-- "bigquery.googleapis.com"
module.myservice.google_project_service.api[1]
module.myservice.google_project_service.api[2]
module.myservice.google_project_service.api[3]
...
```

また、削除ではなく追加する場合でも配列の末尾に追加しないと、index がずれてそれ以降のindex 詰め直しによる再作成が行われる。実質配列のソートはできない。

この問題は for_each に書き直すことで解決する。リソースのアドレス (state) はマップとして作成されるので途中のキーを消しても他のリソースに影響を与えない。

```hcl
resource "google_project_service" "api" {
  for_each = toset(var.gcp_enabled_services)

  project = google_project.service.project_id
  service = each.key
}
```

```console
$ terraform state list
module.myservice.google_project_service.api["bigquery.googleapis.com"]
module.myservice.google_project_service.api["compute.googleapis.com"]
module.myservice.google_project_service.api["container.googleapis.com"]
module.myservice.google_project_service.api["iam.googleapis.com"]
...
```

参考:

[When to Use `for_each` Instead of `count`](https://www.terraform.io/language/meta-arguments/count#when-to-use-for_each-instead-of-count)

> If your instances are almost identical, `count` is appropriate. If some of their arguments need distinct values that can't be directly derived from an integer, it's safer to use `for_each`.
> Before `for_each` was available, it was common to derive count from the length of a list and use `count.index` to look up the original list value:

for_each が追加される前は count によるリソース作成が常套句として用いられていた。ドキュメントにもある通り、for_each が導入された Terraform 0.12.6 以降はこちらを使用したほうが安全なケースが多い。また、count と for_each は同じリソース内に同居できない。


## count を使うとき

基本的に count を使用しないが、例外がある。count が 0 か 1 となる場合である。0 は作成しない、1 は 1 つ作成する (index が 0 番固定になり、詰め直しが発生しない)。

count を使用したリソース作成有無 (0/1) の判定は昔から行われていた手法であるが、その場合においては count を使うほうが好ましい。
この例は enable_gcp という variable が true のときに [google_project](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project) のリソースの作成を行う。

```hcl
resource "google_project" "service" {
  count = var.enable_gcp ? 1 : 0

  name       = "My Service Production"
  project_id = "my-service-prod"
}
```

false のときは 0 となり、リソースは作成されない。[Module](https://www.terraform.io/language/modules/syntax) などで variable (公開したパラメータ) で flag のような挙動を実装するときに使うことができる。

## Splat Expressions

[_splat expression_](https://www.terraform.io/language/expressions/splat) とは [_for expression_](https://www.terraform.io/language/expressions/for) を簡潔に表した表現方法である。

[pagerduty_user](https://registry.terraform.io/providers/PagerDuty/pagerduty/latest/docs/data-sources/user) という [Data source](https://www.terraform.io/language/data-sources) が count によって複数個、作成されている場合、splat で次のように参照することができる。

```hcl
data "pagerduty_user" "oncall_members" {
  count = length(local.service_users)
  email = element(local.service_users, count.index)
}
```

```hcl
data.pagerduty_user.oncall_members[*].id
```

```console
$ terraform state list
module.your_service.data.pagerduty_user.oncall_members[0]
module.your_service.data.pagerduty_user.oncall_members[1]
module.your_service.data.pagerduty_user.oncall_members[2]
```

for_each の場合は、[values](https://www.terraform.io/language/functions/values) を使って参照する。

```hcl
data "pagerduty_user" "oncall_members" {
  for_each = toset(local.service_users)
  email    = each.key
}
```

```hcl
values(data.pagerduty_user.oncall_members)[*].id
```

```console
$ terraform state list
module.your_service.data.pagerduty_user.oncall_members["babarot@xxx.com"]
module.your_service.data.pagerduty_user.oncall_members["foo@xxx.com"]
module.your_service.data.pagerduty_user.oncall_members["bar@xxx.com"]
```

- [for_each and splat · Issue #22476 · hashicorp/terraform](https://github.com/hashicorp/terraform/issues/22476)
- [Output complains about missing attribute when it is shurely present · Issue #23245 · hashicorp/terraform](https://github.com/hashicorp/terraform/issues/23245)

## Legacy Splat Expressions

以前のバージョンでは splat は次のように表現していた。後方互換性を維持するために、まだサポートされ続けているが新しい設定ではおすすめされない。

```hcl
data.pagerduty_user.oncall_members.*.id
```
