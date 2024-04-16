package logger

import (
	"log"
	"log/slog"
	"os"
)

type ILogger interface {
	Debug(msg string, fields ...Fields)
	Info(msg string, fields ...Fields)
	Warn(msg string, fields ...Fields)
	Error(msg string, fields ...Fields)
	With(args ...any) ILogger
}

type Fields map[string]any

type LoggerService struct {
	log *slog.Logger
}

func New() ILogger {
	logger := slog.New(slog.NewJSONHandler(os.Stdout,
		&slog.HandlerOptions{
			Level: setLogLevel(),
			ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
				if a.Key == "time" {
					return slog.Attr{Key: "@timestamp", Value: a.Value}
				}
				return a
			},
		})).With("serviceName", "service-http")

	slog.SetDefault(logger)

	return &LoggerService{log: logger}
}

func (l *LoggerService) With(args ...any) ILogger {
	return &LoggerService{log: l.log.With(args...)}

}

func (l *LoggerService) Info(msg string, fields ...Fields) {
	var attrs []any
	for _, field := range fields {
		for k, v := range field {
			attrs = append(attrs, slog.Any(k, v))
		}
	}
	l.log.Info(msg, attrs...)
}

func (l *LoggerService) Debug(msg string, fields ...Fields) {
	var attrs []any
	for _, field := range fields {
		for k, v := range field {
			attrs = append(attrs, slog.Any(k, v))
		}
	}
	l.log.Debug(msg, attrs...)
}

func (l *LoggerService) Warn(msg string, fields ...Fields) {
	var attrs []any
	for _, field := range fields {
		for k, v := range field {
			attrs = append(attrs, slog.Any(k, v))
		}
	}
	l.log.Warn(msg, attrs...)
}

func (l *LoggerService) Error(msg string, fields ...Fields) {
	var attrs []any
	for _, field := range fields {
		for k, v := range field {
			attrs = append(attrs, slog.Any(k, v))
		}
	}
	l.log.Error(msg, attrs...)
}

type TeeWriter struct {
	stdout *os.File
	file   *os.File
}

func (t *TeeWriter) Write(p []byte) (n int, err error) {
	n, err = t.stdout.Write(p)
	if err != nil {
		return n, err
	}
	n, err = t.file.Write(p)
	return n, err
}

func NewTeeWriter() *slog.Logger {
	// check if the file exists
	dir := "log.txt"
	_, err := os.Stat(dir)
	if os.IsNotExist(err) {
		// create the file
		_, err := os.Create(dir)
		if err != nil {
			log.Fatalf("error creating file: %v", err)
		}
	}
	file, err := os.OpenFile("log.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}

	writer := &TeeWriter{
		stdout: os.Stdout,
		file:   file,
	}

	h := slog.NewJSONHandler(writer, &slog.HandlerOptions{})
	logger := slog.New(h)
	slog.SetDefault(logger)
	return logger
}

func setLogLevel() slog.Leveler {
	logLevel := os.Getenv("LOG_LEVEL")
	switch logLevel {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelDebug
	}
}
