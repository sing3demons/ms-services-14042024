package cache

import (
	"os"
	"time"

	"github.com/go-redis/redis/v8"
)

type Cacher struct{ *redis.Client }

func NewCacher() *Cacher {
	uri := os.Getenv("REDIS_URL")
	if uri == "" {
		uri = "localhost:6379"
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr: uri,
	})
	_, err := redisClient.Ping(redisClient.Context()).Result()
	if err != nil {
		panic(err)
	}

	return &Cacher{redisClient}
}

func (c *Cacher) Set(key string, value interface{}, expiration time.Duration) error {
	return c.SetEX(c.Context(), key, value, expiration).Err()
}
