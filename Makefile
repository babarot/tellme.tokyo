.PHONY: build
build:
	go build -o blog ./cmd/blog/main.go

.PHONY: install
install:
	go install ./cmd/blog
