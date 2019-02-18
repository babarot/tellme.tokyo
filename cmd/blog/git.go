package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strings"
)

// GitStatus is
type GitStatus struct {
	changes []string
}

func getGitStatus() (GitStatus, error) {
	var gs GitStatus
	var stdout, stderr bytes.Buffer
	err := shell{
		stdin:   os.Stdin,
		stdout:  &stdout,
		stderr:  &stderr,
		env:     map[string]string{},
		command: "git",
		args:    []string{"status", "--short", "--porcelain"},
	}.Run(context.Background())
	if err != nil {
		return gs, err
	}
	if len(stderr.Bytes()) > 0 {
		return gs, fmt.Errorf("%s", stderr.String())
	}
	var lines []string
	for {
		text, err := stdout.ReadString('\n')
		text = strings.TrimSuffix(text, "\n")
		if err != nil {
			if err == io.EOF || err == io.ErrClosedPipe {
				break
			}
			return gs, err
		}
		lines = append(lines, text)
	}
	gs.changes = lines
	return gs, nil
}
