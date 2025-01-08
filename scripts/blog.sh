#!/bin/bash
#
# requires:
# - bash 4.4+
# - jq
# - yq
# - fzf
# - bat (sharkdp/bat)
# - mmv (itchyny/mmv)
# - nvim

front_matter=$(cat <<EOF
---
title: "%s"
date: "$(date +%Y-%m-%d)"
description: ""
draft: false
toc: false
---
EOF
)

main() {
  local json
  local actions=(edit create)
  while true
  do
    action=$(printf "%s\n" "${actions[@]}" | command fzf --header 'Any action? Press CTRL-C to quit')
    case "${action}" in
      create)
        create
        ;;
      edit)
        if [[ -z ${json} ]]; then
          json="$(
          for file in $(fd -tf '\.md$' content/post)
          do
            yq -o json --no-colors --front-matter="extract" "${file}" | jq -c ". + {\"file\": \"${file}\"}"
          done | jq --slurp
          )"
        fi
        edit "${json}"
        ;;
      "")
        break
        ;;
      *)
        echo "${action} not allowed" >&2
        return 1
        ;;
    esac
  done
}

create() {
  local dir
  read -p "Title? (used as URL): " input
  dir="content/post/${input}"
  mkdir -p "${dir}"
  printf -- "${front_matter}\n" "${input}" > "${dir}/index.md"
  nvim "${dir}/index.md"
}

edit() {
  local json="${1}"

  while true
  do
    # mapfile requires bash 4.4+
    mapfile -t files < <(
    echo "${json}" | jq -r 'reverse | .[] | select(.draft | not) | .file' |
      fzf \
      --header 'Press CTRL-R to reveal in Finder, CTRL-V to move to...' \
      --preview 'bat --language=markdown --color=always --style=numbers {}' \
      --bind 'ctrl-r:execute-silent(open -R {}),ctrl-v:execute-silent(mmv {})'
    )
    if [[ ${#files[@]} == 0 ]]; then
      return 0
    fi
    nvim "${files[@]}"
  done
}

main "${@}"
