package store

import (
	"context"
	"encoding/base64"
	"log"
	"time"

	"github.com/sing3demons/service-http/config"
	"github.com/sing3demons/service-http/logger"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Store struct {
	*mongo.Client
	logger logger.ILogger
}

func NewStore(cfg *config.Config, logger logger.ILogger) *Store {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	url := cfg.GetMongoURL()
	if url == "" {
		log.Fatal("mongo url is empty")
	}

	decodeURL, err := base64.StdEncoding.DecodeString(url)
	if err != nil {
		log.Fatal(err)
	}

	loggerOptions := options.Logger().SetComponentLevel(options.LogComponentCommand, options.LogLevelDebug)
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(string(decodeURL)).SetLoggerOptions(loggerOptions))
	if err != nil {
		log.Fatal(err)
	}

	return &Store{client, logger}
}
