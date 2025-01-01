---
title: "メソッドを持った interface を要素に持つ struct への JSON Unmarshal"
date: "2019-04-10T23:42:51+09:00"
description: ""
categories: []
draft: true
author: b4b4r07
oldlink: ""
tags:
- go
---

[interface要素を持つstructへのJSON Unmarshal - すぎゃーんメモ](https://memo.sugyan.com/entry/2018/06/23/232559)

これが参考になった。

ただ、このケースで上げているのは interface がどの struct で評価されればいいかわかっているケースだった。
例えば、これをキーに持つ JSON だった場合は struct A で、このキーがなかったら struct B で、みたいなケースは自分で JSON の中を読みにいって判別して Unmarshal する他ない。

具体例を示す。

```go
type State struct {
	Modules []Module `json:"modules"`
}

type Module struct {
	Name      string     `json:"name"`
	Resources []Resource `json:"resources"`
}

// ちなみにメソッドを持っていない場合は
// interface{} として Unmarshal されるのでエラーにならない
type Resource interface {
	Get()
	// ...
}

type AWSModule struct {
	Name string `json:"name"`
}

func (m AWSModule) Get() {}

type GCPModule struct {
	Name    string `json:"name"`
	Project string `json:"project"`
}

func (m GCPModule) Get() {}
```

こういう状況だと上のブログにもある通り、

```go
err := json.NewDecoder(file).Decode(&state)  // state contains Module
// json: cannot unmarshal object into Go struct field Module.resources of type main.Resource
```

ここでエラーが返る。

この場合 interface になっている Resource を要素に持つ struct である Module に対して UnmarshalJSON を実装する。

```go
func (s *Module) UnmarshalJSON(b []byte) error {
	m := map[string]json.RawMessage{}
	if err := json.Unmarshal(b, &m); err != nil {
		return err
	}
	for k, v := range m {
		switch k {
		case "resources":
			var resources []map[string]interface{}
			err := json.Unmarshal([]byte(v), &resources)
			if err != nil {
				return err
			}
			for _, resource := range resources {
				if _, ok := resource["project"]; ok {
					var m GCPModule
					resource, err := json.Marshal(resource)
					if err != nil {
						return err
					}
					err = json.Unmarshal(resource, &m)
					if err != nil {
						return err
					}
					s.Resources = append(s.Resources, m)
				} else {
					var m AWSModule
					resource, err := json.Marshal(resource)
					if err != nil {
						return err
					}
					err = json.Unmarshal(resource, &m)
					if err != nil {
						return err
					}
					s.Resources = append(s.Resources, m)
				}
			}
		default:
		}
	}
	return nil
}
```

コードの見通しはおいておいて、実現したいコード全体がこれ。

`case` の中が肝になっている。一旦 `[]map[string]interface{}` でマップにして GCPModule 固有の `project` をキーに落とし込むべき struct を判定している。
あとは Marshal してマップをバイト列にして、Unmarshal で struct にしている (map to struct)。
ちなみに、先のブログにもある通り、これは他の要素も UnmarshalJSON してあげないと、`default` で抜けていくのでその要素がゼロ値になった struct になってしまう。struct の要素が多い場合は、紹介されていた alias を使うパターンで書いたほうがよい。

また、サーバレスポンスなどがパラメータやイベントによって動的に変わる場合に、その要素の型を json.RawMessage として struct に埋め込んで実装した UnmarshalJSON で遅延評価する場合に json.RawMessage が役立つケースが多いようだった。

例: [Go で構造の一部が動的に変わる JSON を扱いたい – Naomichi Agata – Medium](https://medium.com/@agatan/go-%E3%81%A7%E6%A7%8B%E9%80%A0%E3%81%AE%E4%B8%80%E9%83%A8%E3%81%8C%E5%8B%95%E7%9A%84%E3%81%AB%E5%A4%89%E3%82%8F%E3%82%8B-json-%E3%82%92%E6%89%B1%E3%81%84%E3%81%9F%E3%81%84-cb99efc04193)
