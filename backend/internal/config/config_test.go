package config

import "testing"

func TestDefaults(t *testing.T) {
	cfg, err := Load(func(string) string { return "" })
	if err != nil || cfg.Address != "127.0.0.1:8080" || cfg.DataDir != "../data" {
		t.Fatalf("unexpected defaults: %+v, %v", cfg, err)
	}
}

func TestOverrides(t *testing.T) {
	values := map[string]string{"APP_ADDRESS": "[::1]:9090", "APP_DATA_DIR": "custom-data"}
	cfg, err := Load(func(key string) string { return values[key] })
	if err != nil || cfg.Address != "[::1]:9090" || cfg.DataDir != "custom-data" {
		t.Fatalf("unexpected overrides: %+v, %v", cfg, err)
	}
}

func TestRejectsUnsafeAddresses(t *testing.T) {
	for _, address := range []string{"0.0.0.0:8080", ":8080", "192.168.1.2:8080", "localhost:8080", "127.0.0.1:0", "127.0.0.1:65536", "127.0.0.1:no", "invalid"} {
		t.Run(address, func(t *testing.T) {
			_, err := Load(func(key string) string {
				if key == "APP_ADDRESS" {
					return address
				}
				return ""
			})
			if err == nil {
				t.Fatal("expected invalid address to fail")
			}
		})
	}
}
