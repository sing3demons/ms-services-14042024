package store

import (
	"context"
	"encoding/base64"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Store struct {
	*mongo.Client
}

func NewStore() *Store {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	url := os.Getenv("MONGO_URL")
	if url == "" {
		url = "bW9uZ29kYjovL0RFVl9VU0VSOkMzQkFENTYyLTg5NjgtNENENC05MENFLTQzQjZFMEJBMjM2MkBsb2NhbGhvc3Q6MjcwMTcvdG9kbz9hdXRoU291cmNlPWFkbWlu"
	}

	decodeURL, err := base64.StdEncoding.DecodeString(url)

	if err != nil {
		log.Fatal(err)
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(string(decodeURL)))
	if err != nil {
		log.Fatal(err)
	}

	return &Store{client}
}
