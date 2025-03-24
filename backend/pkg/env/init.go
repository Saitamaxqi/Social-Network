package env

import (
	"log"
	"os"
	"strings"
)

var variables map[string]string

func Init() {
	variables = make(map[string]string)

	file, err := os.ReadFile("vault/.env")
	if err != nil {
		log.Fatal("could not read .env file")
	}

	lines := strings.Split(string(file), "\n")
	for _, line := range lines {
		if line == "" || strings.HasPrefix(line, "#") || !strings.Contains(line, "=") {
			continue
		}
		parts := strings.Split(line, "=")
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		variables[key] = value
	}
}
