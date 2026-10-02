// Package httpapi exposes the orchestrator's HTTP endpoints.
package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

func New(ping func(context.Context) error) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health/live", func(w http.ResponseWriter, r *http.Request) {
		respond(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/health/ready", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), time.Second)
		defer cancel()
		if err := ping(ctx); err != nil {
			respond(w, http.StatusServiceUnavailable, map[string]string{"status": "unavailable", "storage": "unavailable"})
			return
		}
		respond(w, http.StatusOK, map[string]string{"status": "ready", "storage": "ready"})
	})
	return mux
}

func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
