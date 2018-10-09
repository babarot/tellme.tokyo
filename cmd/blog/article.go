package main

import (
	"bufio"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	yaml "gopkg.in/yaml.v2"
)

// Article represents the article information
type Article struct {
	Date time.Time
	File string
	Path string
	Body Body
}

func readArticle(filename string) (*Article, error) {
	article := Article{
		File: filename,
		Path: "content/post/" + filename + ".md",
	}
	content, err := readFile(article.Path)
	if err != nil {
		return &article, err
	}
	err = yaml.Unmarshal(content, &article.Body)
	return &article, err
}

// Save updates the body contents
func (a *Article) Save() error {
	body, err := yaml.Marshal(&a.Body)
	if err != nil {
		return err
	}
	body = append([]byte("---\n"), body...)
	body = append(body, []byte("---\n")...)
	return ioutil.WriteFile(a.Path, body, 0644)
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
		date, _ := time.Parse("2006-01-02T15:04:05-07:00", body.Date)
		articles = append(articles, Article{
			Date: date,
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
