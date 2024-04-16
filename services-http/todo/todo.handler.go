package todo

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"

	"github.com/sing3demons/service-http/cache"
	"github.com/sing3demons/service-http/mlog"
	"github.com/sing3demons/service-http/store"
	"go.mongodb.org/mongo-driver/bson"
)

type todoHandler struct {
	logger *slog.Logger
	rdb    *cache.Cacher
	client *store.Store
}

type TodoHandler interface {
	GetTodos(w http.ResponseWriter, r *http.Request)
}

func NewTodoHandler(logger *slog.Logger, rdb *cache.Cacher, mongoClient *store.Store) TodoHandler {
	return &todoHandler{
		logger: logger,
		rdb:    rdb,
		client: mongoClient,
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
	ctx := r.Context()
	logger := mlog.L(ctx)
	logger.Info("get all todos")

	col := t.client.Database("todo").Collection("tasks")
	logger.Debug("set collection to tasks")
	tasks, err := col.Find(ctx, bson.M{})
	logger.Debug("find all tasks")
	if err != nil {
		logger.Error("failed to get all todos", err)
		response(w).JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	todos := []Task{}
	for tasks.Next(ctx) {
		var todo Task
		tasks.Decode(&todo)
		todo.Href = os.Getenv("HOST") + "/todos/" + todo.ID
		todos = append(todos, todo)
	}

	logger.Info("get all todos success", slog.Any("todos", todos))

	response(w).JSON(http.StatusOK, todos)
}
