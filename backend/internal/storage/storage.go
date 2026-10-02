// Package storage owns the local SQLite connection and schema migrations.
package storage

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func Open(ctx context.Context, dir string) (*sql.DB, error) {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, fmt.Errorf("create data directory: %w", err)
	}
	db, err := sql.Open("sqlite", filepath.Join(dir, "workbench.db"))
	if err != nil {
		return nil, fmt.Errorf("open storage: %w", err)
	}
	// One local connection also keeps connection-specific pragmas consistent.
	db.SetMaxOpenConns(1)
	if err := initialize(ctx, db); err != nil {
		db.Close()
		return nil, fmt.Errorf("initialize storage: %w", err)
	}
	return db, nil
}

func initialize(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, "PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;"); err != nil {
		return err
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var version int
	if err := tx.QueryRowContext(ctx, "PRAGMA user_version").Scan(&version); err != nil {
		return err
	}
	if version > 1 {
		return fmt.Errorf("database schema is newer than this application")
	}
	if version == 0 {
		if _, err := tx.ExecContext(ctx, "CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL); PRAGMA user_version = 1;"); err != nil {
			return err
		}
	}
	return tx.Commit()
}
