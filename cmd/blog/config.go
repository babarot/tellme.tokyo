package main

import (
	"errors"
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
}

// LoadFile loads Config
func (cfg *Config) LoadFile() error {
	configPath, _ := getConfigPath()
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
