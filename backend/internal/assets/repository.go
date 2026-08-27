package assets

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"milkbuddy/backend/internal/generation"
)

type Repository struct {
	db *sql.DB
}

type SQLProvider interface {
	SQLDB() *sql.DB
}

func NewRepository(provider SQLProvider) *Repository {
	return &Repository{db: provider.SQLDB()}
}

func (r *Repository) Create(ctx context.Context, input generation.CreateAsset) error {
	_, err := r.Insert(ctx, CreateAsset{
		ID:           input.ID,
		GenerationID: input.GenerationID,
		ImageIndex:   input.ImageIndex,
		URL:          input.URL,
		StorageKey:   input.StorageKey,
		Filename:     input.Filename,
		StyleID:      input.StyleID,
		AspectRatio:  input.AspectRatio,
		Quality:      input.Quality,
		Width:        input.Width,
		Height:       input.Height,
		Seed:         input.Seed,
		Prompt:       input.Prompt,
		Status:       "generated",
		CreatedAt:    input.CreatedAt,
	})
	return err
}

func (r *Repository) Insert(ctx context.Context, input CreateAsset) (Asset, error) {
	if input.Status == "" {
		input.Status = "generated"
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	_, err := r.db.ExecContext(ctx, `
INSERT INTO assets (
	id, generation_id, image_index, url, storage_key, filename, style_id,
	aspect_ratio, quality, width, height, seed, prompt, status, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		input.ID,
		input.GenerationID,
		input.ImageIndex,
		input.URL,
		input.StorageKey,
		input.Filename,
		input.StyleID,
		input.AspectRatio,
		input.Quality,
		input.Width,
		input.Height,
		input.Seed,
		input.Prompt,
		input.Status,
		input.CreatedAt.Format(time.RFC3339Nano),
	)
	if err != nil {
		return Asset{}, err
	}
	return r.Get(ctx, input.ID)
}

func (r *Repository) List(ctx context.Context, limit int) ([]Asset, error) {
	if limit <= 0 || limit > 100 {
		limit = 60
	}
	rows, err := r.db.QueryContext(ctx, `
SELECT id, generation_id, image_index, url, storage_key, filename, style_id,
	aspect_ratio, quality, width, height, seed, prompt, status, created_at
FROM assets
ORDER BY created_at DESC
LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Asset{}
	for rows.Next() {
		asset, err := scanAsset(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, asset)
	}
	return out, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id string) (Asset, error) {
	row := r.db.QueryRowContext(ctx, `
SELECT id, generation_id, image_index, url, storage_key, filename, style_id,
	aspect_ratio, quality, width, height, seed, prompt, status, created_at
FROM assets
WHERE id = ?`, id)
	return scanAsset(row)
}

func (r *Repository) Count(ctx context.Context) (int, error) {
	var count int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM assets`).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

var ErrNotFound = errors.New("asset not found")

type scanner interface {
	Scan(dest ...interface{}) error
}

func scanAsset(row scanner) (Asset, error) {
	var asset Asset
	var createdAt string
	err := row.Scan(
		&asset.ID,
		&asset.GenerationID,
		&asset.ImageIndex,
		&asset.URL,
		&asset.StorageKey,
		&asset.Filename,
		&asset.StyleID,
		&asset.AspectRatio,
		&asset.Quality,
		&asset.Width,
		&asset.Height,
		&asset.Seed,
		&asset.Prompt,
		&asset.Status,
		&createdAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Asset{}, ErrNotFound
	}
	if err != nil {
		return Asset{}, err
	}
	parsed, err := time.Parse(time.RFC3339Nano, createdAt)
	if err != nil {
		return Asset{}, err
	}
	asset.CreatedAt = parsed
	asset.StyleName = StyleName(asset.StyleID)
	return asset, nil
}

func StyleName(styleID string) string {
	switch styleID {
	case "anime_bishoujo":
		return "美少女动漫"
	case "anime_bishoujo_ultimate":
		return "美少女(3d)"
	case "ultimate_bishoujo":
		return "真实写实"
	default:
		return styleID
	}
}
