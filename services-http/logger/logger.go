package logger

import (
	"log"
	"log/slog"
	"os"
)

func New() *slog.Logger {
	logger := slog.New(slog.NewJSONHandler(os.Stdout,
		&slog.HandlerOptions{
			Level: slog.LevelDebug,
			ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
				if a.Key == "time" {
					return slog.Attr{Key: "@timestamp", Value: a.Value}
				}
				return a
			},
		})).With("serviceName", "service-http")

	slog.SetDefault(logger)

	return logger
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
