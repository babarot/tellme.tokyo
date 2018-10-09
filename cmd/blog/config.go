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
	BlogDir string `yaml:"blog_dir"`
}

func loadConfig() (Config, error) {
	var cfg Config
	rcfiles := []string{
		filepath.Join(os.Getenv("PWD"), ".blogrc"),
		filepath.Join(os.Getenv("HOME"), ".blogrc"),
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yaml"),
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
