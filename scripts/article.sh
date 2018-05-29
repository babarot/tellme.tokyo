#!/bin/bash

title="${1}"

if [[ -z $title ]]; then
    header="No title is given, so open the existing posts..."
    file="$(ls -1 content/post | fzf --height 40% --reverse --header="$header")"
    title="${file##*/}"
    if [[ -z $title ]]; then
        exit 0
    fi
fi
if [[ -f content/post/${title%.md}.md ]]; then
    $EDITOR content/post/${title%.md}.md
    exit $?
fi
hugo new post/${title%.md}.md --editor=$EDITOR
