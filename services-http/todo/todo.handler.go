package todo

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/sing3demons/service-http/logger"
	"github.com/sing3demons/service-http/mlog"
)

type todoHandler struct {
	logger      logger.ILogger
	taskService TaskService
}

type TodoHandler interface {
	GetTodos(w http.ResponseWriter, r *http.Request)
	GetTodoByID(w http.ResponseWriter, r *http.Request)
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

	tq := TaskQuery{
		Page:     1,
		PageSize: 10,
		Sort:     "id",
		Order:    1,
	}

	log.Info("HandlerService :: start================>")
	status := r.URL.Query().Get("status")
	page := r.URL.Query().Get("page")
	pageSize := r.URL.Query().Get("pageSize")
	sort := r.URL.Query().Get("sort")
	order := r.URL.Query().Get("order")

	tq.Status = status
	if page != "" {
		p, err := strconv.Atoi(page)
		if err != nil {
			log.Error("HandlerService ::  ===> get page", logger.Fields{"error": err})
			p = 1
		}
		tq.Page = p
	}
	if pageSize != "" {
		ps, err := strconv.Atoi(pageSize)
		if err != nil {
			log.Error("HandlerService ::  ===> get pageSize", logger.Fields{"error": err})
			ps = 10
		}
		tq.PageSize = ps
	}

	if sort != "" {
		tq.Sort = sort
	}

	if order == "desc" {
		tq.Order = -1
	}

	todos, err := t.taskService.GetTodos(ctx, tq, log)

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

func (t *todoHandler) Param(r *http.Request, s string) string {
	params := mux.Vars(r)
	return params[s]
}

func (t *todoHandler) GetTodoByID(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	log := mlog.L(ctx)

	id := t.Param(r, "id")
	fmt.Println("=============================>", id)

	log.Info("HandlerService :: start================>")
	todo, err := t.taskService.GetTaskByID(ctx, id, log)

	if err != nil {
		log.Error("HandlerService ::  ===> get all todos", logger.Fields{
			"error": err,
		})
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Info("end ======================> ", logger.Fields{
		"todo":     todo,
		"duration": time.Since(start).Seconds(),
	})
	response(w).JSON(http.StatusOK, todo)
}
