package mlog

import (
	"context"
	"log/slog"
	"os"
)

func L(ctx context.Context) *slog.Logger {
	logger := ctx.Value(loggerKey)
	switch logger := logger.(type) {
	case *slog.Logger:
		return logger
	default:
		return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	}
}
