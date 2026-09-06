package assets_test

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"milkbuddy/backend/internal/assets"
	"milkbuddy/backend/internal/store"
)

func TestRepositoryScopesAssetsByUser(t *testing.T) {
	ctx := context.Background()
	db, err := store.Open(filepath.Join(t.TempDir(), "milkbuddy.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer db.Close()

	repo := assets.NewRepository(db)
	base := assets.CreateAsset{
		GenerationID: "gen",
		ImageIndex:   0,
		URL:          "https://example.com/asset.png",
		StyleID:      "anime_bishoujo",
		AspectRatio:  "16:9",
		Quality:      "High",
		Width:        1024,
		Height:       576,
		Seed:         1,
		Prompt:       "prompt",
		Status:       "generated",
		CreatedAt:    time.Now().UTC(),
	}
	first := base
	first.ID = "asset-user-1"
	first.UserID = "user-1"
	second := base
	second.ID = "asset-user-2"
	second.UserID = "user-2"

	if _, err := repo.Insert(ctx, first); err != nil {
		t.Fatalf("insert first asset: %v", err)
	}
	if _, err := repo.Insert(ctx, second); err != nil {
		t.Fatalf("insert second asset: %v", err)
	}

	count, err := repo.CountByUser(ctx, "user-1")
	if err != nil {
		t.Fatalf("count by user: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected user-1 to see 1 asset, got %d", count)
	}

	items, err := repo.ListPageByUser(ctx, "user-1", 24, 0)
	if err != nil {
		t.Fatalf("list by user: %v", err)
	}
	if len(items) != 1 || items[0].ID != first.ID {
		t.Fatalf("expected only %q, got %#v", first.ID, items)
	}

	if _, err := repo.GetByUser(ctx, second.ID, "user-1"); err != assets.ErrNotFound {
		t.Fatalf("expected cross-user get to be not found, got %v", err)
	}
	if err := repo.DeleteByUser(ctx, second.ID, "user-1"); err != assets.ErrNotFound {
		t.Fatalf("expected cross-user delete to be not found, got %v", err)
	}
}
