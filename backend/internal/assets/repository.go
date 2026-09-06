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
		UserID:       input.UserID,
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
	id, user_id, generation_id, image_index, url, storage_key, filename, style_id,
	aspect_ratio, quality, width, height, seed, prompt, status, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		input.ID,
		nullable(input.UserID),
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
	return r.ListPage(ctx, limit, 0)
}

func (r *Repository) ListByUser(ctx context.Context, userID string, limit int) ([]Asset, error) {
	return r.ListPageByUser(ctx, userID, limit, 0)
}

func (r *Repository) ListPage(ctx context.Context, limit, offset int) ([]Asset, error) {
	return r.listPage(ctx, "", limit, offset)
}

func (r *Repository) ListPageByUser(ctx context.Context, userID string, limit, offset int) ([]Asset, error) {
	return r.listPage(ctx, userID, limit, offset)
}

func (r *Repository) listPage(ctx context.Context, userID string, limit, offset int) ([]Asset, error) {
	if limit <= 0 || limit > 100 {
		limit = 24
	}
	if offset < 0 {
		offset = 0
	}
	query := `
SELECT id, user_id, generation_id, image_index, url, storage_key, filename, style_id,
	aspect_ratio, quality, width, height, seed, prompt, status, created_at
FROM assets
`
	args := []interface{}{}
	if userID != "" {
		query += "WHERE user_id = ?\n"
		args = append(args, userID)
	}
	query += `
ORDER BY created_at DESC
LIMIT ? OFFSET ?`
	args = append(args, limit, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
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
	return r.get(ctx, id, "")
}

func (r *Repository) GetByUser(ctx context.Context, id, userID string) (Asset, error) {
	return r.get(ctx, id, userID)
}

func (r *Repository) get(ctx context.Context, id, userID string) (Asset, error) {
	query := `
SELECT id, user_id, generation_id, image_index, url, storage_key, filename, style_id,
	aspect_ratio, quality, width, height, seed, prompt, status, created_at
FROM assets
WHERE id = ?`
	args := []interface{}{id}
	if userID != "" {
		query += " AND user_id = ?"
		args = append(args, userID)
	}
	row := r.db.QueryRowContext(ctx, query, args...)
	return scanAsset(row)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	return r.delete(ctx, id, "")
}

func (r *Repository) DeleteByUser(ctx context.Context, id, userID string) error {
	return r.delete(ctx, id, userID)
}

func (r *Repository) delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM assets WHERE id = ?`
	args := []interface{}{id}
	if userID != "" {
		query += ` AND user_id = ?`
		args = append(args, userID)
	}
	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) Count(ctx context.Context) (int, error) {
	return r.count(ctx, "")
}

func (r *Repository) CountByUser(ctx context.Context, userID string) (int, error) {
	return r.count(ctx, userID)
}

func (r *Repository) count(ctx context.Context, userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM assets`
	args := []interface{}{}
	if userID != "" {
		query += ` WHERE user_id = ?`
		args = append(args, userID)
	}
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
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
	var userID sql.NullString
	err := row.Scan(
		&asset.ID,
		&userID,
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
	asset.UserID = userID.String
	parsed, err := time.Parse(time.RFC3339Nano, createdAt)
	if err != nil {
		return Asset{}, err
	}
	asset.CreatedAt = parsed
	asset.StyleName = StyleName(asset.StyleID)
	return asset, nil
}

func nullable(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
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
