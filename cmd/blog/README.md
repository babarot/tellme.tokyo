blog
====

![Website](https://img.shields.io/website?down_color=lightgrey&down_message=down&up_color=green&up_message=up&url=https%3A%2F%2Ftellme.tokyo)

A tool for writing blogs smoothly

Docs (ja): [スムーズに Hugo でブログを書くツール | tellme.tokyo](https://tellme.tokyo/post/2018/10/16/write-blog-smoothly/)

## Installation




## Usage

```console
$ blog --help
Usage: blog [--version] [--help] <command> [<args>]

Available commands are:
    config    Configure your blog command config file
    edit      Edit blog articles
    new       Create new blog article

```

The configuration is generated at `~/.config/blog/config.yaml` if not exist at first.

You can customize them as you like.

```yaml
finder_commands:
- fzf
- --reverse
- --height
- 50%
blog_dir: /Users/b4b4r07/src/github.com/b4b4r07/tellme.tokyo
```

## TODO

- `blog up` (mainly publish)
- `blog test` (mainly rendering)
