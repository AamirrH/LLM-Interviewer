package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AamirrH/LLM-Interviewer/backend/internal/config"
	"github.com/AamirrH/LLM-Interviewer/backend/internal/httpapi"
	"github.com/AamirrH/LLM-Interviewer/backend/internal/storage"
)

func main() {
	cfg, err := config.Load(os.Getenv)
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, cfg); err != nil {
		slog.Error("orchestrator stopped", "error", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, cfg config.Config) error {
	// Give initialization its own bounded lifetime; even an immediate shutdown
	// leaves a fully initialized database rather than a partial schema.
	initCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	db, err := storage.Open(initCtx, cfg.DataDir)
	if err != nil {
		return err
	}
	defer db.Close()
	listener, err := net.Listen("tcp", cfg.Address)
	if err != nil {
		return fmt.Errorf("listen: %w", err)
	}
	server := &http.Server{
		Handler:           httpapi.New(db.PingContext),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	result := make(chan error, 1)
	go func() { result <- server.Serve(listener) }()
	slog.Info("orchestrator ready", "address", listener.Addr().String())
	select {
	case err := <-result:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			_ = server.Close()
			return err
		}
		return nil
	}
}
