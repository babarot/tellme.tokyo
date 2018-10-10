package main

import (
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/chzyer/readline"
	"github.com/fatih/color"
)

// NewCommand is one of the subcommands
type NewCommand struct {
	CLI
	Option NewOption
}

// NewOption is the options for NewCommand
type NewOption struct {
}

func (c *NewCommand) flagSet() *flag.FlagSet {
	flags := flag.NewFlagSet("new", flag.ExitOnError)
	// flags.BoolVar(&c.Option.Tag, "tag", false, "edit article with tag")
	// flags.BoolVar(&c.Option.Open, "open", false, "open article with browser when editing")
	return flags
}

// Run run new command
func (c *NewCommand) Run(args []string) int {
	return c.exit(c.new(args))
}

// Synopsis returns synopsis
func (c *NewCommand) Synopsis() string {
	return "Create new blog article"
}

// Help returns help message
func (c *NewCommand) Help() string {
	var b bytes.Buffer
	flags := c.flagSet()
	flags.SetOutput(&b)
	flags.PrintDefaults()
	return fmt.Sprintf(
		"Usage of %s:\n\nOptions:\n%s", flags.Name(), b.String(),
	)
}

func (c *NewCommand) new(args []string) error {
	filename, err := scan(color.YellowString("Filename> "), false)
	if err != nil {
		return err
	}
	hugo := newShell("hugo", append([]string{"new", "post/" + filename + ".md"}, args...)...).setDir(c.Config.BlogDir)
	if err = hugo.Run(context.Background()); err != nil {
		return err
	}
	article, err := newArticle(c.Config.BlogDir, filename)
	if err != nil {
		return err
	}
	article.Body.Draft = ask(color.YellowString("Draft?> "))
	article.Body.Tags = func() []string {
		var tags []string
		for {
			tag, err := scan(color.YellowString("tags (Blank to end)> "), false)
			if err != nil {
				continue
			}
			if tag == "" {
				break
			}
			tags = append(tags, tag)
		}
		return tags
	}()
	return article.Save()
}

func ask(prompt string) bool {
	answer, err := scan(prompt, false)
	if err != nil {
		return false
	}
	switch strings.ToLower(answer) {
	case "yes", "y", "true":
		return true
	default:
		return false
	}
}

var (
	// ScanDefaultString is
	ScanDefaultString string
)

func scan(message string, allowEmpty bool) (string, error) {
	tmp := "/tmp"
	if runtime.GOOS == "windows" {
		tmp = os.Getenv("TEMP")
	}
	l, err := readline.NewEx(&readline.Config{
		Prompt:          message,
		HistoryFile:     filepath.Join(tmp, "blog.txt"),
		InterruptPrompt: "^C",
		EOFPrompt:       "exit",
	})
	if err != nil {
		return "", err
	}
	defer l.Close()

	var line string
	for {
		if ScanDefaultString == "" {
			line, err = l.Readline()
		} else {
			line, err = l.ReadlineWithDefault(ScanDefaultString)
		}
		if err == readline.ErrInterrupt {
			if len(line) <= len(ScanDefaultString) {
				break
			} else {
				continue
			}
		} else if err == io.EOF {
			break
		}

		line = strings.TrimSpace(line)
		if line == "" && allowEmpty {
			continue
		}
		return line, nil
	}
	return "", errors.New("canceled")
}
