package todo

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/sing3demons/service-http/cache"
	"github.com/sing3demons/service-http/logger"
)

type TaskService interface {
	GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) ([]Task, error)
}

type taskService struct {
	repo TaskRepository
	rdb  cache.Cacher
}

func NewTaskService(repo TaskRepository, rdb cache.Cacher) TaskService {
	return &taskService{repo, rdb}
}

type TaskQuery struct {
	Status   string `json:"status"`
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Sort     string `json:"sort"`
	Order    int `json:"order"`
}

func (t *taskService) GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) ([]Task, error) {
	log.Debug("TaskService GetTodos ==========>")
	fmt.Println("=====================================TaskService filter ==========>", filter)

	todos := []Task{}

	s, err := t.rdb.Get(ctx, "todos")
	log.Debug("==============>get todos from cache", logger.Fields{
		"todos": s,
		"err":   err,
	})
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
	}
	if s != "" {
		log.Debug("get todos from cache", logger.Fields{
			"todos": s,
		})

		json.Unmarshal([]byte(s), &todos)
		return todos, nil
	}

	todos, err = t.repo.GetTodos(ctx, filter, log)
	log.Debug("get todos from db", logger.Fields{
		"todos": todos,
		"err":   err,
	})
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
		return nil, err
	}

	if len(todos) == 0 {
		log.Debug("no todos found")
		return todos, nil
	}

	value, err := json.Marshal(todos)
	if err != nil {
		log.Error("failed to marshal todos", logger.Fields{
			"error": err,
		})
		return nil, err
	}

	result, err := t.rdb.Set(ctx, "todos", value, 1)
	if err != nil {
		log.Error("failed to set todos to cache", logger.Fields{
			"error": err,
		})
		return nil, err
	}

	log.Debug("set todos to cache", logger.Fields{
		"result": result,
	})

	return todos, nil
}
