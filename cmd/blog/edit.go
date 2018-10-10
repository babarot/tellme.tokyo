package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
)

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
	post := Post{
		Path:  filepath.Join(c.Config.BlogDir, "content", "post"),
		Depth: 1,
	}
	err := post.walk()
	if err != nil {
		return files, err
	}

	var tags []string
	for _, article := range post.Articles {
		tags = append(tags, article.Body.Tags...)
	}
	sort.Strings(tags)

	for _, tag := range uniqSlice(tags) {
		c.Finder.Add(tag, post.Articles.Filter(tag))
	}

	items, err := c.Finder.Select()
	for _, item := range items {
		for _, article := range item.(Articles) {
			files = append(files, article.Path)
		}
	}
	return files, nil
}

func (c *EditCommand) selectFiles() ([]string, error) {
	var files []string
	post := Post{
		Path:  filepath.Join(c.Config.BlogDir, "content", "post"),
		Depth: 1,
	}
	err := post.walk()
	if err != nil {
		return files, err
	}
	post.Articles.SortByDate()
	for _, article := range post.Articles {
		c.Finder.Add(article.Body.Title, article)
	}
	items, err := c.Finder.Select()
	for _, item := range items {
		files = append(files, item.(Article).Path)
	}
	return files, err
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

	go newHugo("server", "-D").setDir(c.Config.BlogDir).Run(ctx)

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
		stdin:  os.Stdin,
		stdout: ioutil.Discard, // to /dev/null
		// stderr:  ioutil.Discard, // to /dev/null
		stderr:  os.Stderr,
		env:     map[string]string{},
		command: "hugo",
		args:    args,
	}
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
