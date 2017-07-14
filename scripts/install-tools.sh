#!/bin/bash

# This scripts installs collection of useful golang tools for CI
type go >/dev/null 2>&1 || { echo "[ERROR] go command is not installed"; exit 1; }

go get -v github.com/golang/dep/cmd/dep
go get -v github.com/Masterminds/glide
go get -v github.com/golang/lint/golint
go get -v github.com/haya14busa/goverage
