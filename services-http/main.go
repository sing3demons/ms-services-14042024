package main

import (
	"context"

	"github.com/sing3demons/service-http/cache"
	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/mlog"
	"github.com/sing3demons/service-http/routes"
	"github.com/sing3demons/service-http/store"
	"github.com/sing3demons/service-http/todo"
)

func main() {
	logger := logger.New()

	rdb := cache.NewCacher(logger)
	defer rdb.Close()

	mongoClient := store.NewStore(logger)
	defer mongoClient.Disconnect(context.Background())

	r := routes.NewMicroservice()
	r.Use(mlog.Middleware(logger))

	todoRepository := todo.NewTaskRepository(mongoClient)
	todoService := todo.NewTaskService(todoRepository, rdb)
	todoHandler := todo.NewTodoHandler(logger, todoService)

	r.GET("/todos", todoHandler.GetTodos)

	r.StartHTTP(":8080")
}
