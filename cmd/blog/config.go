package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	yaml "gopkg.in/yaml.v2"
)

// Config represents blog configration
type Config struct {
	FinderCommands []string `yaml:"finder_commands"`
	BlogDir        string   `yaml:"blog_dir"`
}

func getDefaultDir() (string, error) {
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
	rcfiles := []string{
		filepath.Join(os.Getenv("PWD"), "blog.yaml"),
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yaml"),
		filepath.Join(os.Getenv("HOME"), ".config", "blog", "config.yml"),
	}
	for _, rcfile := range rcfiles {
		if _, err := os.Stat(rcfile); err == nil {
			return rcfile, nil
		}
	}
	return "", errors.New("no config files")
}

// LoadFile loads Config
func (cfg *Config) LoadFile() error {
	file, _ := getConfigPath()
	_, err := os.Stat(file)
	if err == nil {
		buf, err := readFile(file)
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

	dir, _ := getDefaultDir()
	file = filepath.Join(dir, "config.yaml")
	f, err := os.Create(file)
	if err != nil {
		return err
	}

	cfg.FinderCommands = []string{"fzf", "--reverse", "--height", "50%"}
	// TODO
	cfg.BlogDir = filepath.Join(os.Getenv("HOME"), "src", "github.com", "b4b4r07", "tellme.tokyo")
	return yaml.NewEncoder(f).Encode(cfg)
}
