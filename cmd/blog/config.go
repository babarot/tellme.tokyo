package main

import (
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"

	yaml "gopkg.in/yaml.v2"
)

// Config represents blog configration
type Config struct {
	FinderCommands []string `yaml:"finder_commands"`
	BlogDir        string   `yaml:"blog_dir"`
}

func loadConfig() (Config, error) {
	var cfg Config
	rcfiles := []string{
		filepath.Join(os.Getenv("PWD"), ".blogrc"),      // TODO
		filepath.Join(os.Getenv("PWD"), ".blogrc.yaml"), // TODO
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yaml"),
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yml"),
	}
	configPath := ""
	for _, rcfile := range rcfiles {
		if _, err := os.Stat(rcfile); err != nil {
			continue
		}
		configPath = rcfile
	}
	if configPath == "" {
		return cfg, errors.New("no config files")
	}
	buf, err := ioutil.ReadFile(configPath)
	if err != nil {
		return cfg, err
	}
	if err := yaml.Unmarshal(buf, &cfg); err != nil {
		return cfg, err
	}
	return cfg, nil
}
