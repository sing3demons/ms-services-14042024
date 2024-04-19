package todo

import (
	"context"
	"os"

	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/store"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TaskRepository interface {
	GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) ([]Task, int64, error)
}

type taskRepository struct {
	client *store.Store
}

func NewTaskRepository(client *store.Store) TaskRepository {
	return &taskRepository{client}
}

func (t *taskRepository) GetTodos(ctx context.Context, tq TaskQuery, log logger.ILogger) ([]Task, int64, error) {
	log.Info("TaskRepository GetTodos")
	col := t.client.Database("todo").Collection("tasks")

	if tq.Page == 0 {
		tq.Page = 1
	}

	if tq.PageSize == 0 {
		tq.PageSize = 10
	}
	skip := int64((tq.Page - 1) * tq.PageSize)
	limit := int64(tq.PageSize)

	opts := &options.FindOptions{
		Skip:  &skip,
		Limit: &limit,
	}
	opts.SetSort(bson.D{{Key: tq.Sort, Value: tq.Order}})

	filter := bson.M{}

	if tq.Status != "" {
		filter["status"] = tq.Status
	}

	cur, err := col.Find(ctx, filter, opts)
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
		return nil, 0, err
	}

	defer cur.Close(ctx)

	todos := []Task{}
	for cur.Next(ctx) {
		var todo Task
		cur.Decode(&todo)
		todo.Href = os.Getenv("HOST") + "/todos/" + todo.ID
		todos = append(todos, todo)
	}

	total, err := col.CountDocuments(ctx, filter)
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
		return nil, 0, err
	}

	return todos, total, nil
}
