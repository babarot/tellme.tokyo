---
title: "Kubernetes 開発環境構築のいろは"
date: "2017-12-01T00:54:11+09:00"
description: ""
categories: []
draft: false
author: "b4b4r07"
oldlink: ""
tags: ["kubernetes"]

---

## はじめに

[Kubernetes2 Advent Calendar 2017 - Qiita](https://qiita.com/advent-calendar/2017/kubernetes2) 1 日目です。

Kubernetes 上で動かすアプリを作ることが多くなってきていると思いますが、従来のオペレーションとは違う方法で開発やデプロイなどを行う必要があります。
Kubernetes の実行環境として GKE を例に取ると、GCP プロジェクトやその中で作った GKE クラスタ、Kubernetes ネームスペースなど、見る必要のある領域が増えるとともに今までのやり方も変わるはずです。
本記事ではその際のユースケースと、それをいい感じにしてくれるツールを紹介します。

## 今いるクラスタは何か

本番環境と開発環境 (Prod / Dev) でクラスタを分けることは多いと思います。
その他にもクラスタを持っていることもあるでしょう。

[Continuous Delivery のプラットフォーム](http://tech.mercari.com/entry/2017/08/21/092743)として [Spinnaker](https://www.spinnaker.io/) が注目されつつあるので、Kubernetes クラスタへのデプロイはこれに置き換わる可能性[^1]はありますが、Spinnaker がサポートしていない Kubernetes リソース (例えば、[PodDisruptionBudget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) など) については、まだ手動で `kubectl apply` せざるを得ません。
また、基本的なリソースに対する apply 相当のことが Spinnaker によってできるようになったとはいえ、まだまだ手動で apply を実行したい場面もあります。
そこで気をつけたいのは、今いるクラスタとネームスペースの確認です。

Spinnaker は「デプロイ先のクラスタ」と「どのイメージを撒くか (manifest file)」をセットにして内部に持っているので「意図しないクラスタに対して意図しない manifest file をデプロイしてしまう」といった誤操作は防げるのですが、これが `kubectl apply` による手動だと今いるクラスタと `-f` に渡すファイル次第で、互い違いにデプロイしてしまうなどの事故も起こしかねません[^2]。
毎回指差し確認するのも面倒ですし、そもそも確認を徹底するというのは有効打ではないので、常に見えるところに表示しておくのがおすすめです。

{{< hatena "https://github.com/b4b4r07/kubeabc" >}}

手前味噌ですが、現在の Kubernetes クラスタと GCP プロジェクトを表示できるコマンドを書きました。

```console
$ ./kubeabc/cli/kube-context/kube-context
gke_tellme-tokyo/default
```

`クラスタ名/ネームスペース名` になっています。今は長さの関係でリージョン以降は丸めています。

GCP プロジェクトも同じように表示できます。

```console
$ ./kubeabc/cli/gcp-context/gcp-context
gcalcli-1327
```

普段は tmux を使っているので、ステータスバーに表示してあります。

```
set-option -g status-left 'tmux:[#P] #[fg=colour33](K) #(~/bin/kube-context)#[default] #[fg=colour1](G) #(~/bin/gcp-context 2>&1)#[default]'
```

{{< img src="/images/kubeabc/tmux-bar.png" width="400" >}}

シェルのプロンプトに表示できるプラグインも公開されています。

- https://github.com/superbrothers/zsh-kubectl-prompt
- https://github.com/ocadaruma/zsh-gcloud-prompt

とはいえ、常に見えるところに表示しておく、というのもあまり効果的でもないので、apply するときに ask してくるようにしました (後述)。

## クラスタ切り替え

Dev / Prod のスイッチなど一日に何回もします。
そのたびに `gcloud container clusters get-credentials ~` といった長いコマンドは打っていられません。

[kubectx](https://github.com/ahmetb/kubectx/blob/master/kubectx) というコンテキストの切り替えに特化した便利ツールがあるので、これを利用すると良いです。

個人的には [fzf](https://github.com/junegunn/fzf)/[peco](https://github.com/peco/peco) を噛ませたラッパーを使うようにしました: https://github.com/b4b4r07/kubeabc/blob/master/cli/kubectx

## ネームスペース切り替え

クラスタよりも切り替えることの多いのがネームスペースです。
ネームスペースはサービスごとに切ることが多いと思います。
複数のサービスを見ていると `kubectl get -n ネームスペース ...` とネームスペースを指定して実行するのが面倒になってくるので、先にデフォルトのネームスペースを切り替えておくとよいです。
ちなみに指定しない場合はデフォルトで `default` のネームスペースが使用されます。

これも、kubectx と同じく [kubens](https://github.com/ahmetb/kubectx/blob/master/kubens) というネームスペースの切り替えに特化した便利ツールがあるので、これを利用すると良いです。

また、これも [fzf](https://github.com/junegunn/fzf)/[peco](https://github.com/peco/peco) を噛ませたラッパーを使うようにしました: https://github.com/b4b4r07/kubeabc/blob/master/cli/kubens

{{< img src="/images/kubeabc/kubens.gif" width="600" >}}

## ログを見やすくする

`kubectl logs` でログは見れますが、Pod 単位ではなく、Service 単位であったり Namespace 単位で見たい場合が多いでしょう。
そんなときは以下のツールを試すと良いです。

- https://github.com/wercker/stern
- https://github.com/johanhaleby/kubetail
- https://github.com/boz/kail
- https://github.com/dtan4/k8stail

```console
$ stern wiki
```

こんな感じに、ゆるく指定することができるので wiki に関する Pod のログをまとめてみることができます。

{{< img src="/images/kubeabc/stern.gif" width="600" >}}

詳しくは: [kubernetes使いは全員 stern を導入すべき – Daisuke Maki – Medium](https://medium.com/@lestrrat/kubernetes使いは全員-stern-を導入すべき-bc9d3eb2c321/)

## Pod などのリソースに手早くアクセス

`kubectl exec -it xxx-service-dev-v185-qjkh6 bash` とか長くて打てません。
`kubectl get pods` して Pod 名をコピペすることになると思いますが、頻繁にやっているとシンドイです。
こんなときは、Global alias を使うと便利です (zsh ユーザに限られます)。

```console
$ kubectl exec -it P bash
```

キャピタルの `P` は `kubectl get pods | fzf` に展開して実行されるので、インタラクティブに Pod を選んで exec に渡すことができます。

```console
$ kubectl get P
$ kubectl logs -f P
```

{{< img src="/images/kubeabc/global_alias.gif" width="600" >}}

Pod 以外にもいろいろなリソースに対して Gloabl alias を設定しておくことで、短縮して実行することができるようになります。

詳しくは次のリンクを見てください。

https://github.com/b4b4r07/kubeabc/blob/master/scripts/alias.zsh

`kubectl` に関する alias についての Tips がまとまっていたのですが、個人的にこのたぐいは覚えられないので Global alias だけを使っています。

- [Fun with kubectl aliases](https://ahmet.im/blog/kubectl-aliases/)
- https://github.com/ahmetb/kubectl-aliases

## 対話的にコマンド打ち込む

本番環境などに対して `kubectl` コマンドを大量に打ち込むことはないですが、例えば自分が立てた Kubernetes クラスタなどに対して、試験的に動作確認したりする際に便利でした。

- https://github.com/c-bata/kube-prompt
- https://github.com/cloudnativelabs/kube-shell
- https://github.com/errordeveloper/kubeplay

## kube 系のコマンドをまとめる

{{< hatena "https://github.com/b4b4r07/kubeabc/blob/master/cli/kube" >}}

https://github.com/b4b4r07/kubeabc/blob/master/cli/kube

[kubectx](https://github.com/ahmetb/kubectx) などもそうですが、`kube*`、`kube-*` 系の Third party コマンドやエイリアスができてくると、kubectl 系のコマンドと統一したくなります (git のサブコマンドと同じメカニズムで)。

例えば [kubeql](https://github.com/saracen/kubeql)、[kube-shell](https://github.com/cloudnativelabs/kube-shell) といったコマンドの名前の差異をいい感じに吸収して、`kubectl` のサブコマンドの一つとしてまとめて実行できるので便利です。
内部はほとんど `kubectl` のラッパーとして書いています。

{{< img src="/images/kubeabc/kube_shell.png" width="600" >}}

また、これも git と同じように、サブコマンドやリソースのタイポを直して実行してくれるようになっています (地味に便利)。

{{< img src="/images/kubeabc/kube_typo.png" width="600" >}}

前述したように、クラスタを表示しておくというのも確認の延長線にすぎないので、apply などの前に「このクラスタに実行しますよ」という旨を表示します。

{{< img src="/images/kubeabc/kube_apply.png" width="600" >}}

## まとめ

個人的に便利なツールを紹介しました。
[EKS](https://aws.amazon.com/eks/) も発表されたことですし、ガンガン Kubernetes を利用していきましょう。

[^1]: Prod クラスタに Dev クラスタ用の manifest file を撒いてしまうとか
[^2]: 現時点でも置き換えつつあるところも増えていると思います
