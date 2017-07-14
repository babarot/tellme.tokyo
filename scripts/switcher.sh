#!/bin/bash

set -e

gcloud config configurations activate \
    $(gcloud config configurations list | fzf-tmux --reverse --header-lines=1 | awk '{print $1}')

go get github.com/bronze1man/yaml2json
kubectl config use-context \
    $({ kubectl config view | yaml2json; echo } | jq -r '.clusters[].name' | fzf-tmux)

gcloud container clusters \
    get-credentials \
    cluster-1 \
    --zone asia-east1-a \
    --project tellme-tokyo
