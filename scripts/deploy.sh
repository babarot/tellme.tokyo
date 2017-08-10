#!/bin/bash

set -x

IMAGE_TAG=${1:-latest}

docker build -t b4b4r07/tellme.tokyo .
docker tag b4b4r07/tellme.tokyo b4b4r07/tellme.tokyo:${IMAGE_TAG}
docker push b4b4r07/tellme.tokyo:${IMAGE_TAG}
kubectl set image -f kubernetes/deployment.yml blog=b4b4r07/tellme.tokyo:${IMAGE_TAG}
