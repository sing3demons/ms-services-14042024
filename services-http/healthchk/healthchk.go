package healthchk

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/sing3demons/service-http/mlog"
	"github.com/sing3demons/service-http/store"
)

type handler struct {
	store *store.Store
}

func New(store *store.Store) *handler {
	return &handler{store}
}

func (h *handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	logger := mlog.L(ctx)
	logger.Info("health check")
	if err := h.store.Ping(ctx, nil); err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}
