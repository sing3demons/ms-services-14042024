package todo

import (
	"context"
	"fmt"
	"os"

	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/store"
)

type TaskRepository interface {
	GetTodos(ctx context.Context, filter any, log logger.ILogger) ([]Task, error)
}

type taskRepository struct {
	client *store.Store
}

func NewTaskRepository(client *store.Store) TaskRepository {
	return &taskRepository{client}
}

func (t *taskRepository) GetTodos(ctx context.Context, filter any, log logger.ILogger) ([]Task, error) {
	log.Info("TaskRepository GetTodos")
	col := t.client.Database("todo").Collection("tasks")
	cur, err := col.Find(ctx, filter)
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
		return nil, err
	}

	defer cur.Close(ctx)

	todos := []Task{}
	for cur.Next(ctx) {
		var todo Task
		cur.Decode(&todo)
		todo.Href = os.Getenv("HOST") + "/todos/" + todo.ID
		todos = append(todos, todo)
	}

	fmt.Println("=============================>", todos)

	return todos, nil
}
