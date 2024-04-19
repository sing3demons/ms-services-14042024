package todo

import (
	"context"
	"encoding/json"

	"github.com/sing3demons/service-http/cache"
	"github.com/sing3demons/service-http/logger"
)

type TaskService interface {
	GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) (ResponseData[[]Task], error)
}

type taskService struct {
	repo TaskRepository
	rdb  cache.Cacher
}

func NewTaskService(repo TaskRepository, rdb cache.Cacher) TaskService {
	return &taskService{repo, rdb}
}

func (t *taskService) GetTodos(ctx context.Context, filter TaskQuery, log logger.ILogger) (ResponseData[[]Task], error) {
	log.Debug("TaskService GetTodos ==========>")

	response := ResponseData[[]Task]{}

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

		json.Unmarshal([]byte(s), &response)
		return response, nil
	}

	todos, total, err := t.repo.GetTodos(ctx, filter, log)
	log.Debug("get todos from db", logger.Fields{
		"todos": todos,
		"err":   err,
	})
	if err != nil {
		log.Error("GetTodos", logger.Fields{
			"error": err,
		})
		return ResponseData[[]Task]{}, err
	}

	if len(todos) == 0 {
		log.Debug("no todos found")
		return ResponseData[[]Task]{}, nil
	}

	response.Items = todos
	response.Total = total
	response.Page = filter.Page
	response.PageSize = filter.PageSize

	value, err := json.Marshal(response)
	if err != nil {
		log.Error("failed to marshal todos", logger.Fields{
			"error": err,
		})
		return ResponseData[[]Task]{}, err
	}

	result, err := t.rdb.Set(ctx, "todos", value, 1)
	if err != nil {
		log.Error("failed to set todos to cache", logger.Fields{
			"error": err,
		})
		return ResponseData[[]Task]{}, err
	}

	log.Debug("set todos to cache", logger.Fields{
		"result": result,
	})

	return response, nil
}
