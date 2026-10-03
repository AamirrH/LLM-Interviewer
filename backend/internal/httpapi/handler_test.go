package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthRoutes(t *testing.T) {
	for _, tc := range []struct {
		name, path string
		dbErr      error
		want       int
		status     string
	}{
		{"alive without storage", "/api/health/live", errors.New("private-path"), 200, "ok"},
		{"ready", "/api/health/ready", nil, 200, "ready"},
		{"unavailable", "/api/health/ready", errors.New("private-path"), 503, "unavailable"},
		{"unknown", "/api/health/live/extra", nil, 404, ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			pinged := false
			h := New(func(ctx context.Context) error {
				pinged = true
				if _, ok := ctx.Deadline(); !ok {
					t.Error("missing readiness deadline")
				}
				return tc.dbErr
			})
			r := httptest.NewRecorder()
			h.ServeHTTP(r, httptest.NewRequest(http.MethodGet, tc.path, nil))
			if r.Code != tc.want {
				t.Fatalf("status %d: %s", r.Code, r.Body.String())
			}
			if strings.Contains(r.Body.String(), "private-path") {
				t.Fatal("leaked internal error")
			}
			if tc.path == "/api/health/live" && pinged {
				t.Fatal("liveness touched storage")
			}
			if tc.status != "" {
				var body struct {
					Status  string `json:"status"`
					Storage string `json:"storage"`
				}
				if err := json.Unmarshal(r.Body.Bytes(), &body); err != nil || body.Status != tc.status {
					t.Fatalf("unexpected response: %s", r.Body.String())
				}
				if r.Header().Get("Cache-Control") != "no-store" {
					t.Fatal("health must not be cached")
				}
				if tc.path == "/api/health/ready" && body.Storage == "" {
					t.Fatal("missing storage state")
				}
			}
		})
	}
}

func TestHealthRejectsPost(t *testing.T) {
	r := httptest.NewRecorder()
	New(func(context.Context) error { return nil }).ServeHTTP(r, httptest.NewRequest(http.MethodPost, "/api/health/ready", nil))
	if r.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status %d", r.Code)
	}
}
