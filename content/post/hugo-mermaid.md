---
title: "Hugo で PlantUML のようなシーケンス図を描画する"
date: "2018-08-13T18:58:07+09:00"
description: ""
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
- hugo
---

[plantuml]: http://plantuml.com/
[mermaid]: https://github.com/knsv/mermaid

Hugo で [PlantUML][plantuml] を描画して埋め込めないものかと調べていると、

- [Add exec shortcode #796 - gohugoio/hugo・GitHub](https://github.com/gohugoio/hugo/issues/796)

Hugo の [Shortcodes](https://gohugo.io/content-management/shortcodes/) の機能を使って、HTML の生成をフックにしてレンダリングした後に埋め込む、みたいなことをできるようにする議論自体はあったものの進んでいないようで、他の案はないかと調べると [PlantUML][plantuml] ではなく [mermaid][mermaid] が良いとわかった。

[vjeantet/hugo-theme-docdock](https://github.com/vjeantet/hugo-theme-docdock/blob/master/layouts/shortcodes/mermaid.html) にあったディレクトリ構成を真似て以下のようにした。

- [b4b4r07/tellme.tokyo - f8fe64c・GitHub](https://github.com/b4b4r07/tellme.tokyo/commit/f8fe64c05afa28dbda60874ec2584c5b8313126f)

Shortcodes を使って以下のようなシーケンス図を書くと、

```
{{\< mermaid align="left" \>}}
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
    Bob-->John: Jolly good!
{{\< /mermaid \>}}
```

次のようにレンダリングされる。

{{< mermaid align="left" >}}
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
    Bob-->John: Jolly good!
{{< /mermaid >}}

便利になった。

[mermaid](mermaid) の書き方は公式のドキュメントが参考になる。

- [mermaid・GitBook](https://mermaidjs.github.io/)

## 参考

- [Mermaid :: Documentation for Hugo Learn Theme](https://learn.netlify.com/en/shortcodes/mermaid/)
- [Introduce Mermaid diagram support - feature - Hugo Discussion](https://discourse.gohugo.io/t/introduce-mermaid-diagram-support/11276)
