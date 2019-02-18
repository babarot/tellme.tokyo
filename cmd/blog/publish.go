package main

import (
	"bytes"
	"flag"
	"fmt"

	finder "github.com/b4b4r07/go-finder"
	"github.com/k0kubun/pp"
)

// PublishCommand is one of the subcommands
type PublishCommand struct {
	CLI
	Option PublishOption
}

// PublishOption is the options for PublishCommand
type PublishOption struct {
}

func (c *PublishCommand) flagSet() *flag.FlagSet {
	flags := flag.NewFlagSet("publish", flag.ExitOnError)
	return flags
}

// Run run publish command
func (c *PublishCommand) Run(args []string) int {
	flags := c.flagSet()
	if err := flags.Parse(args); err != nil {
		return c.exit(err)
	}

	return c.exit(c.publish())
}

// Synopsis returns synopsis
func (c *PublishCommand) Synopsis() string {
	return "Publish blog articles"
}

// Help returns help message
func (c *PublishCommand) Help() string {
	var b bytes.Buffer
	flags := c.flagSet()
	flags.SetOutput(&b)
	flags.PrintDefaults()
	return fmt.Sprintf(
		"Usage of %s:\n\nOptions:\n%s", flags.Name(), b.String(),
	)
}

func (c *PublishCommand) publish() error {
	gs, err := getGitStatus()
	if err != nil {
		return err
	}
	items := finder.NewItems()
	for _, change := range gs.changes {
		items.Add(change, change[3:])
	}
	selectedItems, err := c.Finder.Select(items)
	if err != nil {
		return err
	}
	for _, item := range selectedItems {
		pp.Println(item)
	}
	return nil
}
