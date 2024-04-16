package todo

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/mlog"
	"go.mongodb.org/mongo-driver/bson"
)

type todoHandler struct {
	logger      logger.ILogger
	taskService TaskService
}

type TodoHandler interface {
	GetTodos(w http.ResponseWriter, r *http.Request)
}

func NewTodoHandler(logger logger.ILogger, taskService TaskService) TodoHandler {
	return &todoHandler{
		logger:      logger,
		taskService: taskService,
	}
}

func response(w http.ResponseWriter) *Response {
	return &Response{w}
}

type Response struct {
	w http.ResponseWriter
}

type Task struct {
	ID          string `json:"id" bson:"id"`
	Href        string `json:"href"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Done        bool   `json:"done"`
	StartDate   string `json:"startDate"`
	EndDate     string `json:"endDate"`
	Status      string `json:"status"`
}

func (r *Response) JSON(statusCode int, data any) error {
	r.w.Header().Set("Content-Type", "application/json")
	r.w.WriteHeader(statusCode)
	return json.NewEncoder(r.w).Encode(data)
}

type HandlerService func(w http.ResponseWriter, r *http.Request)

func (t *todoHandler) GetTodos(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	log := mlog.L(ctx)
	log.Info("HandlerService :: start================>")
	todos, err := t.taskService.GetTodos(ctx, bson.M{}, log)

	if err != nil {
		log.Error("HandlerService ::  ===> get all todos", logger.Fields{
			"error": err,
		})
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Info("end ======================> ", logger.Fields{
		"todos":    todos,
		"duration": time.Since(start).Seconds(),
	})
	response(w).JSON(http.StatusOK, todos)
}
