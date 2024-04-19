package todo

import (
	"context"
	"fmt"
	"os"

	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/store"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TaskRepository interface {
	GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) ([]Task, error)
}

type taskRepository struct {
	client *store.Store
}

func NewTaskRepository(client *store.Store) TaskRepository {
	return &taskRepository{client}
}

func (t *taskRepository) GetTodos(ctx context.Context, tq TaskQuery, log logger.ILogger) ([]Task, error) {
	log.Info("TaskRepository GetTodos")
	col := t.client.Database("todo").Collection("tasks")

	var opts *options.FindOptions
	filter := bson.M{}

	if tq.Status != "" {
		filter["status"] = tq.Status
	}

	if tq.Page > 0 && tq.PageSize > 0 {
		skip := int64((tq.Page - 1) * tq.PageSize)
		limit := int64(tq.PageSize)
		opts = &options.FindOptions{
			Skip:  &skip,
			Limit: &limit,
		}
	}

	opts.SetSort(bson.D{{Key: tq.Sort, Value: tq.Order}})

	cur, err := col.Find(ctx, filter, opts)
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
