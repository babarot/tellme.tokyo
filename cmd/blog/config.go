package main

import (
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"

	yaml "gopkg.in/yaml.v2"
)

// Config represents blog configration
type Config struct {
	FinderCommands []string `yaml:"finder_commands"`
	BlogDir        string   `yaml:"blog_dir"`

	Path string
}

// ConfigCommand is one of the subcommands
type ConfigCommand struct {
	CLI
	Config Config
	Option ConfigOption
}

// ConfigOption is the options for ConfigCommand
type ConfigOption struct {
}

func (c *ConfigCommand) flagSet() *flag.FlagSet {
	flags := flag.NewFlagSet("config", flag.ExitOnError)
	return flags
}

// Run run edit command
func (c *ConfigCommand) Run(args []string) int {
	flags := c.flagSet()
	if err := flags.Parse(args); err != nil {
		return c.exit(err)
	}

	status := newShell("vim", c.Config.Path).Run(context.Background())
	return c.exit(status)
}

// Synopsis returns synopsis
func (c *ConfigCommand) Synopsis() string {
	return "Configure your blog command config file"
}

// Help returns help message
func (c *ConfigCommand) Help() string {
	var b bytes.Buffer
	flags := c.flagSet()
	flags.SetOutput(&b)
	flags.PrintDefaults()
	return fmt.Sprintf(
		"Usage of %s:\n\nOptions:\n%s", flags.Name(), b.String(),
	)
}

// LoadFile loads Config
func (cfg *Config) LoadFile() error {
	configPath, _ := getConfigPath()
	cfg.Path = configPath

	_, err := os.Stat(configPath)
	if err == nil {
		buf, err := ioutil.ReadFile(configPath)
		if err != nil {
			return err
		}
		err = yaml.Unmarshal(buf, &cfg)
		if err != nil {
			return err
		}
		return nil
	}

	if !os.IsNotExist(err) {
		return err
	}

	configDir, err := getConfigDir()
	if err != nil {
		return err
	}
	configPath = filepath.Join(configDir, "config.yaml")
	f, err := os.Create(configPath)
	if err != nil {
		return err
	}

	cfg.BlogDir = filepath.Join(os.Getenv("HOME"), "src", "github.com", "b4b4r07", "tellme.tokyo")
	cfg.FinderCommands = []string{"fzf", "--reverse", "--height", "50%"}
	return yaml.NewEncoder(f).Encode(cfg)
}

func getConfigDir() (string, error) {
	var dir string

	switch runtime.GOOS {
	default:
		dir = filepath.Join(os.Getenv("HOME"), ".config")
	case "windows":
		dir = os.Getenv("APPDATA")
		if dir == "" {
			dir = filepath.Join(os.Getenv("USERPROFILE"), "Application Data")
		}
	}
	dir = filepath.Join(dir, "blog")

	err := os.MkdirAll(dir, 0700)
	if err != nil {
		return dir, fmt.Errorf("cannot create directory: %v", err)
	}

	return dir, nil
}

func getConfigPath() (string, error) {
	configPaths := []string{
		filepath.Join(os.Getenv("PWD"), "blog.yaml"),
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yaml"),
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yml"),
	}
	for _, configPath := range configPaths {
		if _, err := os.Stat(configPath); err == nil {
			return configPath, nil
		}
	}
	return "", errors.New("no available config file")
}
