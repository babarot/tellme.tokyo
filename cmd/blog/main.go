package main

import (
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"

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
	Stdout      io.Writer
	Stderr      io.Writer
	ContentPath string
}

// EditCommand is one of the subcommands
type EditCommand struct {
	CLI
}

// Run run edit command
func (c *EditCommand) Run(args []string) int {
	cwd, err := os.Getwd()
	if err != nil {
		return c.exit(err)
	}

	if filepath.Base(cwd) != envBlog {
		return c.exit(fmt.Errorf("%s: not blog dir", cwd))
	}

	fzf, err := finder.New("fzf", "--reverse", "--height", "40")
	if err != nil {
		return c.exit(err)
	}
	fzf.FromDir(c.ContentPath, true)
	items, err := fzf.Run()
	if err != nil {
		return c.exit(err)
	}
	if len(items) == 0 {
		return c.exit(0)
	}

	ctx, cancel := context.WithCancel(context.Background())
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)
	defer signal.Stop(ch)
	defer cancel()
	go func() {
		select {
		case <-ch:
			cancel()
		case <-ctx.Done():
		}
	}()

	go newHugo("server", "-D").Run(ctx)

	if false {
		quit := make(chan bool)
		go func() {
			// discard error
			runCommand("open", envHostURL)
			quit <- true
		}()
		<-quit
	}

	vim := newShell("vim", items...)
	return c.exit(vim.Run(context.Background()))
}

// Synopsis returns synopsis
func (c *EditCommand) Synopsis() string {
	return "Edit blog articles"
}

// Help returns help message
func (c *EditCommand) Help() string {
	return "Usage: edit"
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
	app := cli.NewCLI(envAppName, envAppVersion)
	app.Args = os.Args[1:]
	app.Commands = map[string]cli.CommandFactory{
		"edit": func() (cli.Command, error) {
			return &EditCommand{
				CLI: CLI{
					Stdout:      os.Stdout,
					Stderr:      os.Stderr,
					ContentPath: envContentPath, // TODO: support args
				},
			}, nil
		},
	}
	exitStatus, err := app.Run()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
	os.Exit(exitStatus)
}

func newHugo(args ...string) shell {
	return shell{
		stdin:   os.Stdin,
		stdout:  ioutil.Discard, // to /dev/null
		stderr:  ioutil.Discard, // to /dev/null
		env:     map[string]string{},
		command: "hugo",
		args:    args,
	}
}

func newShell(command string, args ...string) shell {
	return shell{
		stdin:   os.Stdin,
		stdout:  os.Stdout,
		stderr:  os.Stderr,
		env:     map[string]string{},
		command: command,
		args:    args,
	}
}

type shell struct {
	stdin   io.Reader
	stdout  io.Writer
	stderr  io.Writer
	env     map[string]string
	command string
	args    []string
}

func (s shell) Run(ctx context.Context) error {
	command := s.command
	if _, err := exec.LookPath(command); err != nil {
		return err
	}
	for _, arg := range s.args {
		command += " " + arg
	}
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd", "/c", command)
	} else {
		cmd = exec.CommandContext(ctx, "sh", "-c", command)
	}
	cmd.Stderr = s.stderr
	cmd.Stdout = s.stdout
	cmd.Stdin = s.stdin
	for k, v := range s.env {
		cmd.Env = append(os.Environ(), fmt.Sprintf("%s=%s", k, v))
	}
	return cmd.Run()
}

func runCommand(command string, args ...string) error {
	return newShell(command, args...).Run(context.Background())
}
