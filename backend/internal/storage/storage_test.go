package storage

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestOpenMigratesAndPersists(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "nested", "data")
	for attempt := 0; attempt < 2; attempt++ {
		db, err := Open(context.Background(), dir)
		if err != nil {
			t.Fatal(err)
		}
		var version int
		if err := db.QueryRow("PRAGMA user_version").Scan(&version); err != nil || version != 1 {
			t.Fatalf("version=%d err=%v", version, err)
		}
		if attempt == 0 {
			if _, err := db.Exec("INSERT INTO app_metadata (key, value) VALUES ('persistence-test', 'kept')"); err != nil {
				t.Fatal(err)
			}
		} else {
			var value string
			if err := db.QueryRow("SELECT value FROM app_metadata WHERE key = 'persistence-test'").Scan(&value); err != nil || value != "kept" {
				t.Fatalf("value=%q err=%v", value, err)
			}
		}
		if err := db.Close(); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "workbench.db")); err != nil {
		t.Fatal(err)
	}
}

func TestOpenFailsForInvalidDirectory(t *testing.T) {
	file := filepath.Join(t.TempDir(), "file")
	if err := os.WriteFile(file, []byte("not a directory"), 0600); err != nil {
		t.Fatal(err)
	}
	if db, err := Open(context.Background(), file); err == nil {
		db.Close()
		t.Fatal("expected failure")
	}
}

func TestOpenFailsForCanceledContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if db, err := Open(ctx, t.TempDir()); err == nil {
		db.Close()
		t.Fatal("expected cancellation")
	}
}
