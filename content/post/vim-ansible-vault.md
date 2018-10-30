---
title: "開いたファイルに対して ansible-vault を Vim から実行する"
date: "2018-01-31T00:20:45+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["vim", "ansible-vault"]

---

生の何かをそのままリポジトリの置いておくのが微妙ということで特定のファイルを `ansible-vault` で暗号化してプッシュする、ということはよくあると思います。  
例えば、Kubernetes の Secret を管理した YAML ファイルとかですね (例として正しいかは別の話ですが)。

その場合、こんな感じで暗号化する必要があります。

```console
$ ansible-vault encrypt --vault-password-file=~/.vault_password secret.yaml
```

初回だけで済むならそこまで不便ではないのですが、このファイルを編集し再度リポジトリに上げるには復号と暗号化のセットも必要になります。
これがとても面倒です。
編集が必要ということは Vim なりのエディタで開くわけなので、そこでこのセットもいっぺんにできたら便利なわけです。

というわけで開いているファイル (バッファ) に対して `ansible-vault (encrypt|decrypt)` を実行するプラグインをつくりました。

{{< hatena "https://github.com/b4b4r07/vim-ansible-vault" >}}

GIF イメージにある Credentials はサンプルです。

{{< img src="/images/vim-ansible-vault.gif" >}}

filetype が ansible-vault であれば yes/no で復号するかどうか聞いてあげると、もう一手間省けるのでさらに便利な気もしますが、とりあえずの不便さは解消されたので現状使える Vim コマンドと機能はこれだけです。

- `:AnsibleVaultEncrypt`
- `:AnsibleVaultDecrypt`

便利になりました。

### 追記 (2018-10-25)

[chase/vim-ansible-yaml: Add additional support for Ansible in VIM](https://github.com/chase/vim-ansible-yaml)

先行実装がありました。ただメンテが滞っておりメンテナーを募集しているみたいです。
