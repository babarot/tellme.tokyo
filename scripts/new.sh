#!/bin/bash

title="${1}"
if [[ -z $title ]]; then
    echo "No title is given, so open the existing posts..."
    title="$(ls -1 content/post | fzf --height 40% --reverse)"
    title="${title##*/}"
fi
if [[ -f content/post/${title%.md}.md ]]; then
    $EDITOR content/post/${title%.md}.md
    exit $?
fi
hugo new post/${title%.md}.md --editor=$EDITOR
