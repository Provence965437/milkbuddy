package store

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

type DB struct {
	sql *sql.DB
}

func Open(path string) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	store := &DB{sql: db}
	if err := store.migrate(context.Background()); err != nil {
		db.Close()
		return nil, err
	}
	return store, nil
}

func (db *DB) Close() error {
	return db.sql.Close()
}

func (db *DB) SQLDB() *sql.DB {
	return db.sql
}

func (db *DB) migrate(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := db.sql.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	password_salt TEXT NOT NULL,
	credits INTEGER NOT NULL DEFAULT 100,
	is_admin INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
	token TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
	id TEXT PRIMARY KEY,
	generation_id TEXT NOT NULL,
	image_index INTEGER NOT NULL,
	url TEXT NOT NULL,
	storage_key TEXT,
	filename TEXT,
	style_id TEXT NOT NULL,
	aspect_ratio TEXT NOT NULL,
	quality TEXT NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	seed INTEGER NOT NULL,
	prompt TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'generated',
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_style_id ON assets(style_id);
`)
	if err != nil {
		return err
	}
	if err := db.ensureColumn(ctx, "users", "credits", "INTEGER NOT NULL DEFAULT 100"); err != nil {
		return err
	}
	return db.ensureColumn(ctx, "users", "is_admin", "INTEGER NOT NULL DEFAULT 0")
}

func (db *DB) ensureColumn(ctx context.Context, table, column, definition string) error {
	rows, err := db.sql.QueryContext(ctx, `PRAGMA table_info(`+table+`)`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var dataType string
		var notNull int
		var defaultValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &pk); err != nil {
			return err
		}
		if strings.EqualFold(name, column) {
			return rows.Err()
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	_, err = db.sql.ExecContext(ctx, `ALTER TABLE `+table+` ADD COLUMN `+column+` `+definition)
	return err
}
