package store

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
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
	return err
}
