package cache

import (
	"context"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sing3demons/service-http/logger"
)

type Cacher interface {
	Close() error
}

type cacher struct {
	*redis.Client
	logger logger.ILogger
}

func NewCacher(logger logger.ILogger) Cacher {
	uri := os.Getenv("REDIS_URL")
	if uri == "" {
		uri = "localhost:6379"
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr: uri,
	})
	_, err := redisClient.Ping(context.Background()).Result()
	if err != nil {
		panic(err)
	}

	return &cacher{redisClient, logger}
}

func (c *cacher) Close() error {
	return c.Client.Close()
}

func (c *cacher) Get(ctx context.Context, key string) (string, error) {
	statusCmd := c.Client.Get(ctx, key)
	// c.logger.Debug("get key", slog.String("key", key), slog.String("value", statusCmd.String()))
	c.logger.Debug("get key", logger.Fields{
		"key":   key,
		"value": statusCmd.String(),
	})
	return statusCmd.Result()
}

func (c *cacher) Set(ctx context.Context, key string, value any, expiration time.Duration) (string, error) {
	statusCmd := c.Client.Set(ctx, key, value, expiration)
	c.logger.Debug("get key", logger.Fields{
		"key":    key,
		"value":  value.(string),
		"status": statusCmd,
	})
	return statusCmd.Result()
}

func (c *cacher) Del(ctx context.Context, key string) (int64, error) {
	statusCmd := c.Client.Del(ctx, key)
	c.logger.Debug("delete key", logger.Fields{
		"key":    key,
		"status": statusCmd,
	})
	return statusCmd.Result()
}
