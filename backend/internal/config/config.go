// Package config reads the local orchestrator's process configuration.
package config

import (
	"fmt"
	"net"
	"strconv"
)

type Config struct {
	Address string
	DataDir string
}

func Load(getenv func(string) string) (Config, error) {
	cfg := Config{Address: "127.0.0.1:8080", DataDir: "../data"}
	if value := getenv("APP_ADDRESS"); value != "" {
		cfg.Address = value
	}
	if value := getenv("APP_DATA_DIR"); value != "" {
		cfg.DataDir = value
	}
	host, port, err := net.SplitHostPort(cfg.Address)
	if err != nil {
		return Config{}, fmt.Errorf("APP_ADDRESS must be a loopback IP and port")
	}
	ip := net.ParseIP(host)
	portNumber, portErr := strconv.Atoi(port)
	if ip == nil || !ip.IsLoopback() || portErr != nil || portNumber < 1 || portNumber > 65535 {
		return Config{}, fmt.Errorf("APP_ADDRESS must use a loopback IP and a port from 1 to 65535")
	}
	return cfg, nil
}
