package main

import (
	"log/slog"
	"net/http"
	"os"

	"milkbuddy/backend/internal/assets"
	"milkbuddy/backend/internal/auth"
	"milkbuddy/backend/internal/comfy"
	"milkbuddy/backend/internal/config"
	"milkbuddy/backend/internal/generation"
	"milkbuddy/backend/internal/httpapi"
	"milkbuddy/backend/internal/objectstore"
	"milkbuddy/backend/internal/store"
)

func main() {
	config.LoadEnvFile(".env")
	cfg := config.Load()

	comfyClient := comfy.NewClient(cfg.ComfyBaseURL, cfg.HTTPTimeout)
	r2Store, err := objectstore.NewR2(cfg.R2, cfg.HTTPTimeout)
	if err != nil {
		slog.Error("invalid R2 configuration", "error", err)
		os.Exit(1)
	}
	db, err := store.Open(cfg.DatabasePath)
	if err != nil {
		slog.Error("open database failed", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	assetRepo := assets.NewRepository(db)
	workflow := generation.NewWorkflowTemplate(cfg.WorkflowPath)
	authService := auth.NewService(db)
	generationService := generation.NewService(comfyClient, r2Store, assetRepo, workflow)
	server := httpapi.NewServer(authService, generationService, assetRepo, r2Store, cfg.CORSOrigin)

	slog.Info("starting milkbuddy backend", "addr", cfg.Addr, "comfy_base_url", cfg.ComfyBaseURL, "database_path", cfg.DatabasePath, "r2_enabled", r2Store != nil)
	if err := http.ListenAndServe(cfg.Addr, server.Handler()); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
