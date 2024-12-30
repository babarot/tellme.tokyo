---
title: "2024年振り返り"
date: "2024-12-30"
description: ""
categories: []
draft: true
---


# 仕事 / Work

## 10X

来月(来年1月)で4年目になる。

## hoge

It’s not easy to get people contributing to an open source project, but it’s really easy to make sure they don’t. When new people try to get involved with a project they’re excited and eager to participate. Contacting a mailing list, commenting on a blog post or sending a pull request is the start of a conversation between the project developers and a potential contributor.

Not all opinions or code offered fit a project or the direction a project wants to go in. That’s okay, but how this message is relayed makes all the difference in the world.

```go
package main

import (
	"os"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

func main() {
	u := launcher.New().
		NoSandbox(true). // workaround for launching failure in Ubuntu 24.04
		MustLaunch()

	pageURL := os.Getenv("SHARING_SLO_URL")
	if pageURL == "" {
		panic("SHARING_SLO_URL is not set")
	}
	outputFile := os.Getenv("OUTPUT_FILE")
	if outputFile == "" {
		panic("OUTPUT_FILE is not set")
	}
	browser := rod.New().
		ControlURL(u).
		MustConnect().
		MustPage(pageURL).
		MustWindowFullscreen()
	browser.MustWaitStable().MustScreenshotFullPage(outputFile)
	defer browser.MustClose()
}

```


# それ以外 / Life

## 車

{{< gallery
  match="images/*"
  sortOrder="desc"
  rowHeight="150"
  margins="5"
  thumbnailResizeOptions="600x600 q90 Lanczos"
  thumbnailHoverEffect="enlarge"
  showExif=true
  previewType="none"
  lastRow="justify"
  embedPreview=true
  loadJQuery=true
>}}

<!-- {{< img src="./images/z1.jpg" >}} -->
<!-- {{< img src="./images/z2.jpg" >}} -->
<!-- {{< img src="./images/z3.jpg" >}} -->
<!-- {{< img src="./images/z4.jpg" >}} -->

<!-- {{< rawhtml >}} -->
<!-- <blockquote class="twitter-tweet"><p lang="ja" dir="ltr">1年記念日 <a href="https://t.co/Okb2vzp3Xw">pic.twitter.com/Okb2vzp3Xw</a></p>&mdash; @babarot ⚡️ (@b4b4r07) <a href="https://twitter.com/b4b4r07/status/1855958971506708771?ref_src=twsrc%5Etfw">November 11, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> -->
<!-- {{< /rawhtml >}} -->


1年記念



## ジム、筋トレ

継続できている。昨年パーソナルをお願いしてメニューを固めてそれをベースにボディメイクしてきた。今はそれをアップデートしながら24Hジムに切り替えてて通っている。

### 実は

hogehoge

### test

It’s not easy to get people contributing to an open source project, but it’s really easy to make sure they don’t. When new people try to get involved with a project they’re excited and eager to participate. Contacting a mailing list, commenting on a blog post or sending a pull request is the start of a conversation between the project developers and a potential contributor.

Not all opinions or code offered fit a project or the direction a project wants to go in. That’s okay, but how this message is relayed makes all the difference in the world.
