---
title: "Bind Address で少しハマった話"
date: "2018-08-16T00:55:17+09:00"
description: "特定条件を満たして hugo server しローカルからアクセスする必要がありその際に bind address でハマった"
categories: []
draft: false
author: b4b4r07
oldlink: ""
tags:
- hugo
- bind-address
- network
---

以下の要件を満たして `hugo server` を立ち上げたいという要求がありテンポラリで対応することになった。

- `hugo server` はローカルではなく、ある GCE インスタンスで実行する
- ローカルから繋ぎたいが、ポートフォワードは使わない

この要件を満たすためには、

- GCE インスタンスに :1313 でつなぎに行けるようにポートを開ける (ファイアウォールの設定)
- ポートフォワードは使えないので、グローバル IP を取る (とりあえず Ephemeral)

以下を参考に Firewall rule を設定して、GCE インスタンスにアプライした。

[How to open a specific port such as 9090 in Google Compute Engine - Stack Overflow](https://stackoverflow.com/questions/21065922/how-to-open-a-specific-port-such-as-9090-in-google-compute-engine)

<img src="/images/bind-address/1.png" width="400">

<img src="/images/bind-address/2.png" width="400">

動作確認として適当に Serve するスクリプトで :1313 を LISTEN して nmap してみた。

```go
package main

import (
	"net/http"
	"io"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "Hello world!")
}

func main() {
	http.HandleFunc("/", helloHandler)
	http.ListenAndServe(":1313", nil)
}
```

```console
$ nmap -p 1313 <ip_address>
...
PORT     STATE SERVICE
1313/tcp open  bmc_patroldb

Nmap done: 1 IP address (1 host up) scanned in 0.37 seconds
```

問題なさそうなので、

```console
[b4b4r07@instance-1 site] hugo server
```

次はこれで行けるかとローカルから `http://<ip_address>:1313/` でリクエストすると Connection refused になった。

`ps` しても hugo プロセスはいるし、

```console
[b4b4r07@instance-1 site] curl localhost:1313
```

しても問題ない。

しかし、よく hugo の STDOUT を見ると、

```console
...
Total in 11 ms
Watching for changes in /home/user/site/{content,data,layouts,static,themes}
Watching for config changes in /home/user/site/config.toml
Serving pages from memory
Running in Fast Render Mode. For full rebuilds on change: hugo server --disableFastRender
Web Server is available at http://localhost:1313/ (bind address 127.0.0.1)
Press Ctrl+C to stop
```

bind address が 127.0.0.1 になっていた。

```console
[b4b4r07@instance-1 site] hugo server --bind 0.0.0.0
...
Web Server is available at http://localhost:1313/ (bind address 0.0.0.0)
Press Ctrl+C to stop
```

で起動して、`http://<ip_address>:1313/` すると 200 になった。

{{<hatena "https://keens.github.io/blog/2016/02/24/bind_addressnoimigayouyakuwakatta/" >}}

これの理解にはこの記事が役立った。

127.0.0.1 を指定したらローカルホストからで、0.0.0.0 だと外部からも参照できるくらいにしか考えたことがなかったので、この機会を得たことでいい勉強になった。
