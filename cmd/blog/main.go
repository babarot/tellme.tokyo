package main

import (
	"fmt"
	"io"
	"os"

	finder "github.com/b4b4r07/go-finder"
	"github.com/mitchellh/cli"
)

const (
	envAppName     = "blog"
	envAppVersion  = "0.1.0"
	envContentPath = "content/post"
	envHostURL     = "http://localhost:1313"
	envBlog        = "tellme.tokyo"
)

// CLI represents the command-line interface
type CLI struct {
	Stdout io.Writer
	Stderr io.Writer
	Config Config
	Finder finder.Finder
}

func (c CLI) exit(msg interface{}) int {
	switch m := msg.(type) {
	case int:
		return m
	case nil:
		return 0
	case string:
		fmt.Fprintf(c.Stdout, "%s\n", m)
		return 0
	case error:
		fmt.Fprintf(c.Stderr, "[ERROR] %s: %s\n", envAppName, m.Error())
		return 1
	default:
		panic(msg)
	}
}

func main() {
	var cfg Config
	if err := cfg.LoadFile(); err != nil {
		fmt.Fprintf(os.Stderr, "[ERROR] %s: %v\n", envAppName, err)
		os.Exit(1)
	}
	// TODO
	finder, _ := finder.New(cfg.FinderCommands...)
	// finder.Install("") // TODO
	blog := CLI{
		Stdout: os.Stdout,
		Stderr: os.Stderr,
		Config: cfg,
		Finder: finder,
	}

	app := cli.NewCLI(envAppName, envAppVersion)
	app.Args = os.Args[1:]
	app.Commands = map[string]cli.CommandFactory{
		"edit": func() (cli.Command, error) {
			return &EditCommand{CLI: blog}, nil
		},
		"new": func() (cli.Command, error) {
			return &NewCommand{CLI: blog}, nil
		},
		"config": func() (cli.Command, error) {
			return &ConfigCommand{CLI: blog, Config: cfg}, nil
		},
	}
	exitStatus, err := app.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "[ERROR] %s: %v\n", envAppName, err)
	}
	os.Exit(exitStatus)
}
