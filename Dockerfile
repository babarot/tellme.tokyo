# dockefile for my blog
# https://hub.docker.com/r/b4b4r07/tellme.tokyo/

MAINTAINER BABAROT b4b4r07@gmail.com

FROM golang:1.8-alpine AS hugo
RUN apk add --update --no-cache git && \
    go get -v github.com/spf13/hugo && \
    apk del --purge git
COPY . /app
WORKDIR /app
RUN hugo

FROM nginx:alpine AS nginx
COPY --from=hugo /app/public /usr/share/nginx/html
