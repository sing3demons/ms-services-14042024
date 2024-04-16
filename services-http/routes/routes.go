package routes

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/mux"
)

type Microservice interface {
	Use(middleware mux.MiddlewareFunc)
	GET(path string, handler http.HandlerFunc)
	POST(path string, handler http.HandlerFunc)
	StartHTTP(port string) error
}

type muxRouter struct {
	*mux.Router
}

func NewMicroservice() Microservice {
	r := mux.NewRouter()
	return &muxRouter{r}
}

func (m *muxRouter) getLocalIP() net.IP {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	localAddress := conn.LocalAddr().(*net.UDPAddr)

	return localAddress.IP
}

func (m *muxRouter) StartHTTP(port string) error {
	s := &http.Server{
		Addr:         port,
		Handler:      m,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	host := m.getLocalIP()
	log.Printf("starting server at %s", fmt.Sprintf("http://%s%s", host, port))

	go func() {
		err := s.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			log.Fatal("unexpected shutdown the server", err)

		}
		log.Println("gracefully shutdown the server")
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	gCtx := context.Background()
	ctx, cancel := context.WithTimeout(gCtx, 10*time.Second)
	defer cancel()

	if err := s.Shutdown(ctx); err != nil {
		log.Fatal("unexpected shutdown the server", err)
	}
	return nil
}

func (m *muxRouter) Use(middleware mux.MiddlewareFunc) {
	m.Router.Use(middleware)
}

func (m *muxRouter) GET(path string, handler http.HandlerFunc) {
	m.HandleFunc(path, handler).Methods(http.MethodGet)
}

func (m *muxRouter) POST(path string, handler http.HandlerFunc) {
	m.HandleFunc(path, handler).Methods(http.MethodPost)
}
