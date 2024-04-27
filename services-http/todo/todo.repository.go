package todo

import (
	"context"
	"sync"

	"github.com/sing3demons/service-http/config"
	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/store"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TaskRepository interface {
	GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) ([]Task, int64, error)
	GetTaskByID(ctx context.Context, id string, log logger.ILogger) (Task, error)
}

type taskRepository struct {
	client *store.Store
	cfg    *config.Config
}

func NewTaskRepository(client *store.Store, cfg *config.Config) TaskRepository {
	return &taskRepository{client, cfg}
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

	var wg sync.WaitGroup
	var mutex sync.Mutex
	todos := []Task{}
	var total int64

	errCh := make(chan error, 2)
	cur, err := col.Find(ctx, filter, opts)
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
		return nil, 0, err
	}

	// Goroutine for fetching todos
	wg.Add(1)
	go func() {
		defer wg.Done()
		for cur.Next(ctx) {
			var todo Task
			if err := cur.Decode(&todo); err != nil {
				errCh <- err
				return
			}
			todo.Href = t.cfg.GetHost() + "/todos/" + todo.ID
			mutex.Lock()
			todos = append(todos, todo)
			mutex.Unlock()
		}
	}()

	// Goroutine for counting total documents
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		total, err = col.CountDocuments(ctx, filter)
		if err != nil {
			errCh <- err
		}
	}()

	// Wait for goroutines to finish
	wg.Wait()
	close(errCh)

	// Check for errors
	for err := range errCh {
		if err != nil {
			log.Error("GetTodos", logger.Fields{
				"error": err,
			})
			return nil, 0, err
		}
	}

	return todos, total, nil
}

func (t *taskRepository) GetTaskByID(ctx context.Context, id string, log logger.ILogger) (Task, error) {
	log.Info("TaskRepository GetTaskByID")
	col := t.client.Database("todo").Collection("tasks")

	filter := bson.M{"id": id}

	var todo Task
	err := col.FindOne(ctx, filter).Decode(&todo)
	if err != nil {
		log.Error("GetTaskByID", logger.Fields{
			"error": err,
		})
		return Task{}, err
	}
	todo.Href = t.cfg.GetHost() + "/todos/" + todo.ID

	return todo, nil
}
