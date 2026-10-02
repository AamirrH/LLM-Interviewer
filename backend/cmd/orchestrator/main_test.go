package main

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/AamirrH/LLM-Interviewer/backend/internal/config"
)

func TestRunShutsDownOnCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	result := make(chan error, 1)
	go func() { result <- run(ctx, config.Config{Address: "127.0.0.1:0", DataDir: t.TempDir()}) }()
	cancel()
	select {
	case err := <-result:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("shutdown timed out")
	}
}

func TestRunReportsOccupiedPort(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	err = run(context.Background(), config.Config{Address: listener.Addr().String(), DataDir: t.TempDir()})
	if err == nil {
		t.Fatal("expected bind failure")
	}
}
