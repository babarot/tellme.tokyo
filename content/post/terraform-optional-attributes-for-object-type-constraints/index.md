---
title: "Terraform の object variable で柔軟なパラメータ設定を提供する (optional default)"
date: "2022-07-03T02:55:06+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
image: ""
tags: ["terraform"]

---

[^1]: Terraform の variable は "変数" ではなく、Module の挙動を外部から変更するためのインターフェイスである https://tellme.tokyo/post/2022/06/15/terraform-variables-is-api/

## object variable の optional default とは

Terraform v1.3.0 から object variable の optional default が使えるようになる (現在は experimental で [v1.3.0-alpha](https://github.com/hashicorp/terraform/releases/tag/v1.3.0-alpha20220622) で利用可能)

- [Optional arguments in object variable type definition · Issue #19898 · hashicorp/terraform](https://github.com/hashicorp/terraform/issues/19898)
- [[Request] module_variable_optional_attrs: Optional default · Issue #30750 · hashicorp/terraform](https://github.com/hashicorp/terraform/issues/30750)

どういう機能かというと、object type の variable にて、object attribute (object の key に対応する value) で optional() を設定したときに一緒に default value を指定できるようにするもの。

こうすることで optional のパラメータ (object attribute) に対してユーザからの Input がなかった場合、null ではなく指定した default value が使用される。

例: 次のような variable があるとき

```hcl
variable "with_optional_attribute" {
  type = object({
    a = string                # a required attribute
    b = optional(string)      # an optional attribute
    c = optional(number, 127) # an optional attribute with a default value
  })
}
```

以下の値を引数 (Input) で渡して plan してみると、

```console
$ terraform plan -var='with_optional_attribute={"a"="foo"}'
Changes to Outputs:
  + with_optional_attribute = {
      + a = "foo"
      + b = null
      + c = 127
    }
```

- `a` (required): Input で指定された foo
- `b` (optional): Input がなく default value がないため null
- `c` (optional): Input がないが default value が指定されているので 127

で更新されていることがわかる。

## どういうときに使えるか

モジュール開発者が object type の variable を使って設定変更のインターフェイス[^1]を提供している場合を考える。モジュール開発者は新しい機能を追加したときに、モジュール利用者がその設定を変更できるように attribute もあわせて追加するとする。

そのとき、モジュール利用者がその attribute をたとえ使わなかったとしても (= default value でよかったとしても) 同じようにモジュールファイル側で追加しないと attribute 不足エラーになってしまう。つまりモジュールをアップグレードしただけで、設定ファイルを変更していないのにもかかわらず plan が通らなくなってしまう。

これを回避するには、モジュールのバージョン管理をするしかない。利用するモジュールのバージョンを固定することで、latest に変更があったとしても plan に影響が出ないようにする。基本的にこれは正しい方法で、とくに Module Registory を使う場合などについては Terraform としてもモジュールのバージョン管理することを推奨されている。しかし必ずしもそうではない場合 (local source など) は都度エラーに対応する必要があった _(これについては、新しいバージョンが公開されたら上げ続ける or 上げるようにお願いして回る必要があるという面倒くさい作業が発生するジレンマがある)_。

しかし、この default optional をうまく使うことでユーザに不用意な対応をお願いすることなく (バージョン管理を強要することなく)、新しいインターフェイスを提供することができるようになった。また、モジュールファイル側に必ずしもすべての attribute を記載する必要がなくなったのでファイル自体の見通しも良くなる。

例えば以下のような設定が object variable によって提供されていた場合を考える。この例ではすべての attribute を記述しているが、実際にユーザが default から値を変えているのは schedule.interval だけである。つまり、他の設定については変更する必要がないのでファイルに記述する必要がない。

```hcl
# (before)
pagerduty = {
  enable = true
  service = {
    support_hours = {
      start_time   = "09:00:00" # default
      end_time     = "17:00:00" # default
      days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri"] # default
    }
  }
  schedule = {
    create   = true
    timezone = "Asia/Tokyo" # default
    interval = "30m"        # default is 5m
  }
}
```

それを optional default によって他を省略することができるので設定ファイルは次のようになる。

```hcl
# (after)
pagerduty = {
  enable = true
  schedule = {
    create   = true
    interval = "30m" # default is 5m
  }
}
```

## object of object で object 自体を optional にする場合

この場合、object of object は pagerduty.schedule で pagerduty.schedule.timezone を optional にし、そもそも pagerduty.schedule 自体も optional にしようというケース (pagerduty.schedule object を新たに追加したユースケース) を考える。

次の HCL が期待した動作をする。

- pagerduty.schedule (object) 自体を optional にする
- pagerduty.schedule (object) の中の attribute をそれぞれ optional にする

```hcl
# main.tf

terraform {
  experiments = [module_variable_optional_attrs]
}

variable "pagerduty" {
  description = "PagerDuty configurations"

  type = object({
    enable = optional(bool, false)
    schedule = optional(
      object({
        create   = optional(bool, false)
        timezone = optional(string, "Asia/Tokyo")
      }),
      {
        create   = false
        timezone = "Asia/Tokyo"
      }
    )
  })
}

output "pagerduty" {
  value = var.pagerduty
}
```

### 1. object の中身 (schedule.timezone) を省略した場合

```hcl
# example.tfvars
pagerduty = {
  enable = true
  schedule = {
    create = true
  }
}
```

```console
$ terraform plan -var-file=example.tfvars
Changes to Outputs:
  + pagerduty = {
      + enable   = true
      + schedule = {
          + create   = true
          + timezone = "Asia/Tokyo"
        }
    }
```

### 2. object (schedule) 自体を省略した場合

```hcl
# example.tfvars
pagerduty = {
  enable = true
}
```

```console
$ terraform plan -var-file=example.tfvars
Changes to Outputs:
  + pagerduty = {
      + enable   = true
      + schedule = {
          + create   = false
          + timezone = "Asia/Tokyo"
        }
    }
```

## optional にする必要性

最後に、optional にする必要性を振り返る。

バージョン管理をしていないモジュールの場合、もしくはしているが、ユーザに不本意な attribute 不足によるエラーを生じさせたくないといった場合に optional default を使うと良いことがわかった。

一方で、attribute 不足によるエラーを出したほうがいい場合もある。例えば、バージョン管理をしている前提で新しい attribute を追加した場合、optional になっている attribute についてはリリースノートなどを確認しない限り知ることができない。基本的に新しい機能を提供する場合、既存に影響が出ないように (= plan に diff が発生しないように) するべきだが、そうできない場合は optional ではないほうが優しい UX といえる。

どんなインターフェイスやモジュールの利用体験になっていると良いかを考えて (e.g. attribute をはやしすぎて機能変更を許しすぎてないだろうか、default value は何がふさわしいだろうか) optional default や object variable を使っていく必要がある。

### 良くない例: アップグレード (v0.2.0) したら diff が出る (PagerDuty の Schedule リソースを作成する pagerduty.create_schedule の default が true なことでアップグレードした瞬間にモジュールがリソースを作ろうとする)

v0.2.0 にする。

```hcl
version = "v0.2.0"

pagerduty = {
  enable = true
}
```

上げたら何か追加されそうになる。どんな attribute が追加されたか、またそれでどのようなリソースを作ろうとしているのか調べる必要がある。

```console
$ terraform plan
...
Plan: 2 to add, 0 to change, 0 to destroy.
```

### 良い例: アップグレードしたら (v0.2.0) attribute 不足エラーになる。そのタイミングでどんな attribute を追加するべきかを知ることができ、true にするか false にするか選ぶことができる

v0.2.0 にする。

```hcl
version = "v0.2.0"

pagerduty = {
  enable = true
}
```

attribute 不足エラーになる。

```console
$ terraform plan
| Error: Invalid value for input variable
|
|   on module_service_kit.tf line 21, in module "service-a":
|   21:   pagerduty = {
|   22:     enable = true
|   24:   }
|
| The given value is not suitable for module.service-a.var.pagerduty declared at ...
| "create_schedule" is required.
```

create_schedule (default は true) を追加した上で明示的に false にする

```hcl
version = "v0.2.0"

pagerduty = {
  enable          = true
  create_schedule = false
}
```

アップグレードしたことによるリソース変更がなく今まで通り。

```console
$ terraform plan
...
No changes. Your infrastructure matches the configuration.
```
