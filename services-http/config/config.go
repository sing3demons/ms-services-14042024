package config

import "os"

type Config struct {
	Mode     string
	RedisURL string
	LogLevel string
	MongoURL string
	Host     string
	Port     string
}

func New() *Config {
	return &Config{
		Mode:     os.Getenv("MODE"),
		RedisURL: os.Getenv("REDIS_URL"),
		LogLevel: os.Getenv("LOG_LEVEL"),
		MongoURL: os.Getenv("MONGO_URL"),
		Host:     os.Getenv("HOST"),
		Port:     os.Getenv("PORT"),
	}
}

func (cfg *Config) GetMode() string {
	if cfg.Mode == "" {
		return "DEVELOPMENT"
	}
	return cfg.Mode
}

func (cfg *Config) GetRedisURL() string {
	return cfg.RedisURL
}

func (cfg *Config) GetLogLevel() string {
	return cfg.LogLevel
}

func (cfg *Config) GetMongoURL() string {
	return cfg.MongoURL
}

func (cfg *Config) GetHost() string {
	return cfg.Host
}

func (cfg *Config) GetPort() string {
	return cfg.Port
}
