package main

import (
	"bufio"
	"bytes"
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
	"sort"

	yaml "gopkg.in/yaml.v2"

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

func (c CLI) validate() error {
	cwd, err := os.Getwd()
	if err != nil {
		return err
	}
	if filepath.Base(cwd) != envBlog {
		return fmt.Errorf("%s: not blog dir", cwd)
	}
	return nil
}

func main() {
	blog := CLI{
		Stdout:      os.Stdout,
		Stderr:      os.Stderr,
		ContentPath: envContentPath, // TODO: support args
	}
	if err := blog.validate(); err != nil {
		fmt.Fprintf(os.Stderr, "[ERROR] %s: %v\n", envAppName, err)
		os.Exit(1)
	}

	app := cli.NewCLI(envAppName, envAppVersion)
	app.Args = os.Args[1:]
	app.Commands = map[string]cli.CommandFactory{
		"edit": func() (cli.Command, error) {
			return &EditCommand{CLI: blog}, nil
		},
	}
	exitStatus, err := app.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "[ERROR] %s: %v\n", envAppName, err)
	}
	os.Exit(exitStatus)
}

// EditCommand is one of the subcommands
type EditCommand struct {
	CLI
	Option EditOption
}

// EditOption is the options for EditCommand
type EditOption struct {
	Tag  bool
	Open bool
}

func (c *EditCommand) flagSet() *flag.FlagSet {
	flags := flag.NewFlagSet("edit", flag.ExitOnError)
	flags.BoolVar(&c.Option.Tag, "tag", false, "edit article with tag")
	flags.BoolVar(&c.Option.Open, "open", false, "open article with browser when editing")
	return flags
}

// Run run edit command
func (c *EditCommand) Run(args []string) int {
	flags := c.flagSet()
	if err := flags.Parse(args); err != nil {
		return c.exit(err)
	}

	var files []string
	var err error
	if c.Option.Tag {
		files, err = c.selectFilesWithTag()
	} else {
		files, err = c.selectFiles()
	}
	if err != nil {
		return c.exit(err)
	}

	return c.exit(c.edit(files))
}

// Synopsis returns synopsis
func (c *EditCommand) Synopsis() string {
	return "Edit blog articles"
}

// Help returns help message
func (c *EditCommand) Help() string {
	var b bytes.Buffer
	flags := c.flagSet()
	flags.SetOutput(&b)
	flags.PrintDefaults()
	return fmt.Sprintf(
		"Usage of %s:\n\nOptions:\n%s", flags.Name(), b.String(),
	)
}

func (c *EditCommand) selectFilesWithTag() ([]string, error) {
	var files []string
	articles, err := walk(c.ContentPath, 1)
	if err != nil {
		return files, err
	}
	fzf, err := finder.New("fzf", "--reverse", "--height", "40")
	if err != nil {
		return files, err
	}
	fzf.From(func(out io.WriteCloser) error {
		var tags []string
		for _, article := range articles {
			tags = append(tags, article.Body.Tags...)
		}
		sort.Strings(tags)
		for _, tag := range uniqSlice(tags) {
			fmt.Fprintln(out, tag)
		}
		return nil
	})
	items, err := fzf.Run()
	if err != nil {
		return files, err
	}
	for _, item := range items {
		for _, article := range articles.Filter(item) {
			files = append(files, article.Path)
		}
	}
	return files, nil
}

func (c *EditCommand) selectFiles() ([]string, error) {
	fzf, err := finder.New("fzf", "--reverse", "--height", "40")
	if err != nil {
		return []string{}, err
	}
	fzf.FromDir(c.ContentPath, true)
	return fzf.Run()
}

func (c *EditCommand) edit(files []string) error {
	if len(files) == 0 {
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

	if c.Option.Open {
		quit := make(chan bool)
		go func() {
			// discard error
			runCommand("open", envHostURL)
			quit <- true
		}()
		<-quit
	}

	vim := newShell("vim", files...)
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

// Article represents the article information
type Article struct {
	File string
	Path string
	Body Body
}

// Body represents article contents
type Body struct {
	Title       string   `yaml:"title"`
	Date        string   `yaml:"date"`
	Description string   `yaml:"description"`
	Categories  []string `yaml:"categories"`
	Draft       bool     `yaml:"draft"`
	Author      string   `yaml:"author"`
	Oldlink     string   `yaml:"oldlink"`
	Tags        []string `yaml:"tags"`
}

// Articles is a collection of articles
type Articles []Article

// Filter filters articles
func (as *Articles) Filter(tag string) Articles {
	articles := make(Articles, 0)
	for _, article := range *as {
		if stringInSlice(tag, article.Body.Tags) {
			articles = append(articles, article)
		}
	}
	return articles
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func walk(base string, depth int) (Articles, error) {
	var articles Articles
	err := filepath.Walk(base, func(path string, info os.FileInfo, err error) error {
		if path == base {
			return nil
		}
		if info == nil {
			return err
		}
		content, err := readFile(path)
		if err != nil {
			return err
		}
		var body Body
		if err = yaml.Unmarshal(content, &body); err != nil {
			return err
		}
		articles = append(articles, Article{
			File: filepath.Base(path),
			Path: path,
			Body: body,
		})
		return nil
	})

	return articles, err
}

func readFile(path string) ([]byte, error) {
	var encount int
	var content string
	file, err := os.Open(path)
	if err != nil {
		return []byte{}, err
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		if scanner.Text() == "---" {
			encount++
		}
		if encount == 2 {
			break
		}
		content += scanner.Text() + "\n"
	}
	return []byte(content), scanner.Err()
}

func uniqSlice(s []string) []string {
	for i := 0; i < len(s); i++ {
		for i2 := i + 1; i2 < len(s); i2++ {
			if s[i] == s[i2] {
				// delete
				s = append(s[:i2], s[i2+1:]...)
				i2--
			}
		}
	}
	return s
}
