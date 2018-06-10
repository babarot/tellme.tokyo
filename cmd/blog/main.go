package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"

	finder "github.com/b4b4r07/go-finder"
)

const (
	envContentPath = "content/post"
	envHostURL     = "http://localhost:1313"
	envBlog        = "tellme.tokyo"
)

type cli struct {
	option option
	stdout io.Writer
	stderr io.Writer
	path   string
}

type option struct {
	open bool
}

func main() {
	var opt option
	flag.BoolVar(&opt.open, "open", false, "open url")
	flag.Parse()
	c := cli{
		option: opt,
		stdout: os.Stdout,
		stderr: os.Stderr,
		path:   envContentPath, // TODO: support args
	}
	if err := c.Run(); err != nil {
		fmt.Fprintln(c.stderr, err.Error())
		os.Exit(1)
	}
}

func (c cli) Run() error {
	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	if filepath.Base(cwd) != envBlog {
		return fmt.Errorf("%s: not blog dir", cwd)
	}

	fzf, err := finder.New("fzf", "--reverse", "--height", "40")
	if err != nil {
		return err
	}
	fzf.FromDir(c.path, true)
	items, err := fzf.Run()
	if err != nil {
		return err
	}
	if len(items) == 0 {
		return nil
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

	if c.option.open {
		quit := make(chan bool)
		go func() {
			// discard error
			runCommand("open", envHostURL)
			quit <- true
		}()
		<-quit
	}

	vim := newShell("vim", items...)
	return vim.Run(context.Background())
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
