package config

import (
	"bufio"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Addr         string
	ComfyBaseURL string
	WorkflowPath string
	DatabasePath string
	HTTPTimeout  time.Duration
	CORSOrigin   string
	R2           R2Config
}

type R2Config struct {
	AccountID       string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
	PublicBaseURL   string
}

func Load() Config {
	return Config{
		Addr:         env("MILKBUDDY_ADDR", ":8080"),
		ComfyBaseURL: strings.TrimRight(env("COMFY_BASE_URL", "https://u1021121-bfff-8c327e31.westc.seetacloud.com:8443"), "/"),
		WorkflowPath: env("COMFY_WORKFLOW_PATH", "configs/workflows/z_image_turbo.json"),
		DatabasePath: env("DATABASE_PATH", "data/milkbuddy.db"),
		HTTPTimeout:  time.Duration(envInt("HTTP_TIMEOUT_SECONDS", 60)) * time.Second,
		CORSOrigin:   env("CORS_ORIGIN", "http://127.0.0.1:4173,http://localhost:4173"),
		R2: R2Config{
			AccountID:       env("R2_ACCOUNT_ID", ""),
			Bucket:          env("R2_BUCKET", ""),
			AccessKeyID:     env("R2_ACCESS_KEY_ID", ""),
			SecretAccessKey: env("R2_SECRET_ACCESS_KEY", ""),
			PublicBaseURL:   strings.TrimRight(env("R2_PUBLIC_BASE_URL", ""), "/"),
		},
	}
}

func LoadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" || os.Getenv(key) != "" {
			continue
		}
		os.Setenv(key, strings.Trim(strings.TrimSpace(value), `"`))
	}
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
