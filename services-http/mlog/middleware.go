package mlog

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/sing3demons/service-http/logger"
)

type contextKey string

const (
	sessionKey contextKey = "session"
	loggerKey  contextKey = "logger"
)

func logMiddleware(ctx context.Context, logger logger.ILogger) logger.ILogger {
	session, exits := ctx.Value(loggerKey).(string)
	if !exits {
		session = uuid.New().String()
	}
	logger = logger.With("session", session)
	return logger
}

func Middleware(logger logger.ILogger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			session := r.Header.Get("x-request-id")
			if session == "" {
				xSession := r.Header.Get("x-session-id")
				if xSession != "" {
					session = xSession
				} else {
					session = uuid.New().String()
				}
			}
			ctx := context.WithValue(r.Context(), sessionKey, session)
			l := logMiddleware(ctx, logger)
			ctx = context.WithValue(ctx, loggerKey, l)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
