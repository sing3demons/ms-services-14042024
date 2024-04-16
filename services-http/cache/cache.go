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
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value any, exp uint) (string, error)
}

type cacher struct {
	*redis.Client
	logger logger.ILogger
}

func NewCacher(log logger.ILogger) Cacher {
	uri := os.Getenv("REDIS_URL")
	if uri == "" {
		uri = "localhost:6379"
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr: uri,
	})
	cmd, err := redisClient.Ping(context.Background()).Result()
	if err != nil {
		panic(err)
	}

	log.Info("start redis", logger.Fields{
		"ping":   "success",
		"status": cmd,
	})

	return &cacher{redisClient, log}
}

func (c *cacher) Close() error {
	return c.Client.Close()
}

func (c *cacher) Get(ctx context.Context, key string) (string, error) {
	statusCmd := c.Client.Get(ctx, key)
	c.logger.Debug("get=>key", logger.Fields{
		"key":   key,
		"value": statusCmd.String(),
		"error": statusCmd.Err(),
	})

	if statusCmd.Err() != nil {
		c.logger.Debug("get ==> key", logger.Fields{
			"key": key,
			"err": statusCmd.Err(),
		},
		)

		return "", statusCmd.Err()
	}
	s, err := statusCmd.Result()
	c.logger.Debug("get key", logger.Fields{
		"key":   key,
		"value": s,
		"err":   err,
	})
	if err != nil {
		c.logger.Error("get ==> key", logger.Fields{
			"key": key,
			"err": err,
		})

		return "", err
	}
	return s, nil
}

func (c *cacher) Set(ctx context.Context, key string, value any, exp uint) (string, error) {
	var expiration time.Duration
	if exp > 0 {
		expiration = time.Duration(exp) * time.Second
	}

	statusCmd := c.Client.Set(ctx, key, value, expiration)
	c.logger.Debug("get key", logger.Fields{
		"key":    key,
		"value":  value,
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
