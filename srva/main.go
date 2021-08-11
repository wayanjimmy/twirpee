package main

import (
	"context"
	"fmt"

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

func main() {
	fmt.Println("vim-go")
}
