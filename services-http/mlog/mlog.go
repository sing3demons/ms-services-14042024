package mlog

import (
	"context"

	typeLog "github.com/sing3demons/service-http/logger"
)

func L(ctx context.Context) typeLog.ILogger {
	logger := ctx.Value(loggerKey)
	switch logger := logger.(type) {
	case typeLog.ILogger:
		return logger
	default:
		return typeLog.New()
	}
}
