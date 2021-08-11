package main

import (
	"context"
	"net/http"

	"github.com/wayanjimmy/twirpee/srva/protos"
)

type Server struct{}

var _ protos.AService = (*Server)(nil)

func (s *Server) CallServiceA(ctx context.Context, req *protos.GetServiceARequest) (*protos.GetServiceAResponse, error) {
	var (
		resp protos.GetServiceAResponse
		err  error
	)

	var responses []*protos.ServiceAResponse

	for i := 0; i < 10; i++ {
		responses = append(responses, &protos.ServiceAResponse{
			ServiceName: "A",
			Status:      "OK",
		})
	}

	resp.Responses = responses

	return &resp, err
}

func corsMiddleware(h http.HandlerFunc) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		rw.Header().Set("Access-Control-Allow-Origin", "*")
		rw.Header().Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT")
		rw.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")

		if r.Method == "OPTIONS" {
			rw.Write([]byte("allowed"))
			return
		}

		h(rw, r)
	}
}

func main() {
	// TODO: Try another mux, such as labstack's echo

	twirpHandler := protos.NewAServiceServer(&Server{})

	mux := http.NewServeMux()

	mux.HandleFunc(twirpHandler.PathPrefix(), corsMiddleware(twirpHandler.ServeHTTP))

	http.ListenAndServe(":8080", mux)
}
