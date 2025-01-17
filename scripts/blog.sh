#!/usr/bin/env bash
#
# requires:
# - bash 4.4+
# - jq
# - yq
# - fzf
# - tac
# - fd (sharkdp/fd)
# - bat (sharkdp/bat)
# - exa
# - mmv (itchyny/mmv)
# - nvim

content_dir="content/post"
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

if [[ -z $FZF_DEFAULT_OPTS ]]; then
  FZF_DEFAULT_OPTS="--height 75% --multi --layout=reverse"
fi

main() {
  local json action
  local actions=(edit create)
  local exclude_draft=false
  local -a args

  bash_version=$(bash --version | sed -nE 's/^.* version ([0-9]+\.[0-9]+\.[0-9]+).*$/\1/p')
  if vercomp ${bash_version} "4.4"; then
    echo "requires bash 4.4+" >&2
    return 1
  fi

  while (( ${#} > 0 ))
  do
    case "${1}" in
      --exclude-draft)
        exclude_draft=true
        ;;
      -*)
        echo "${1}: no such option" >&2
        return 1
        ;;
      *)
        args+=("${1}")
        ;;
    esac
    shift
  done

  while true
  do
    action=$(printf "%s\n" "${actions[@]}" | fzf --no-multi --header 'Any action? Press CTRL-C to quit')
    case "${action}" in
      create)
        create
        ;;
      edit)
        if [[ -z ${json} ]] && ${exclude_draft}; then
          json="$(
          for file in $(fd -tf '\.md$' "${content_dir}")
          do
            yq -o json --no-colors --front-matter="extract" "${file}" |
              jq -c ". + {\"file\": \"${file}\"}"
          done | jq --slurp
          )"
        fi
        hugo --quiet server &
        edit "${json}"
        kill "$(jobs -p)"
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
  local dir input
  read -r -p "Title? (used as URL): " input
  dir="${content_dir}/${input}"
  mkdir -p "${dir}"
  printf -- "${front_matter}\n" "${input}" > "${dir}/index.md"
  nvim "${dir}/index.md"
}

edit() {
  local json="${1}"
  local -a files
  local exa_snippet

  # shellcheck disable=SC2016
  exa_snippet='
    dir=$(dirname {})
    if [[ ${dir} =~ 20[0-9]+$ ]]; then
      exa -a --tree --group-directories-first --git-ignore {}
      echo
      echo "PARENT DIR:"
      exa -a --tree --level 1 --group-directories-first --git-ignore ${dir}
    else
      exa -a --tree --group-directories-first --git-ignore ${dir}
    fi
  '
  # shellcheck disable=SC2016
  help_snippet='
    echo "FILE OPS"
    echo " [ctrl-r] reveal the file on the cursor with Finder"
    echo " [ctrl-v] move or rename files"
    echo ""
    echo "PREVIEW"
    echo " [ctrl-l] show file content with syntax highlight"
    echo " [ctrl-/] toggle(hide/show) preview window"
    echo " [?]      show this help"
    echo " [right]  look inside the directory of the file on the cursor"
    echo " [left]   refresh preview window"
    echo ""
    echo "CURSOR"
    echo " [tab]    select + down"
    echo " [S-tab]  deselect + down"
  '

  # shellcheck disable=SC2016
  while true
  do
    # mapfile requires bash 4.4+
    mapfile -t files < <(
    if [[ -n ${json} ]]; then
      echo "${json}" | jq -r 'reverse | .[] | select(.draft | not) | .file'
    else
      fd -tf '\.md$' ${content_dir} | tac
    fi |
      content_dir=${content_dir} fzf \
      --header 'Press "?" to show help of key bindings!' \
      --preview 'yq --colors --prettyPrint --front-matter=extract {}' \
      --bind 'tab:select+down' \
      --bind 'shift-tab:deselect+up' \
      --bind 'ctrl-r:execute-silent(open -R {})' \
      --bind 'ctrl-v:execute-silent(mmv $(dirname {})/*)' \
      --bind 'ctrl-l:preview(bat --language=markdown --color=always --style=numbers {})' \
      --bind 'ctrl-/:change-preview-window(hidden|down,border-top|)' \
      --bind "?:preview:$help_snippet" \
      --bind "right:preview:$exa_snippet" \
      --bind 'left:refresh-preview' \
      --bind 'change:reload(fd -tf "\.md$" ${content_dir} | tac)'
    )
    if [[ ${#files[@]} == 0 ]]; then
      return 0
    fi
    nvim "${files[@]}"
  done
}

# https://stackoverflow.com/questions/4023830/how-to-compare-two-strings-in-dot-separated-version-format-in-bash
vercomp() {
  # args: min, actual, max
  printf '%s\n' "$@" | sort -C -V
}

# https://apple.stackexchange.com/questions/83939/compare-multi-digit-version-numbers-in-bash/123408#123408
# e.g.
# if (( ! $(version "${bash_version}") > $(version 4.4) )); then
version() {
  echo "$@" | awk -F. '{ printf("%d%03d%03d%03d\n", $1,$2,$3,$4); }'
}


main "${@}"
