package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sing3demons/service-http/cache"
	"github.com/sing3demons/service-http/config"
	"github.com/sing3demons/service-http/healthchk"
	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/mlog"
	"github.com/sing3demons/service-http/routes"
	"github.com/sing3demons/service-http/store"
	"github.com/sing3demons/service-http/todo"
)

func init() {
	if os.Getenv("MODE") != "PRODUCTION" {
		if err := godotenv.Load(".env.dev"); err != nil {
			log.Fatal("Error loading .env file")
		}

	}
}

func main() {
	cfg := config.New()
	logger := logger.New()

	rdb := cache.NewCacher(cfg, logger)
	defer rdb.Close()

	mongoClient := store.NewStore(cfg, logger)
	defer mongoClient.Disconnect(context.Background())

	r := routes.NewMicroservice()
	r.Use(mlog.Middleware(logger))

	hHealthChk := healthchk.New(mongoClient)
	r.GET("/healthz", hHealthChk.HealthCheck)

	todoRepository := todo.NewTaskRepository(mongoClient, cfg)
	todoService := todo.NewTaskService(todoRepository, rdb)
	todoHandler := todo.NewTodoHandler(logger, todoService)

	r.GET("/todos/{id}", todoHandler.GetTodoByID)
	r.GET("/todos", todoHandler.GetTodos)

	r.StartHTTP(":" + cfg.Port)
}
