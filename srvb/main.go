package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/wayanjimmy/twirpee/srva/protos"
)

func main() {
	// Set a http proxy to the http client
	// for easier debugging
	proxyURL, _ := url.Parse("http://localhost:8899")

	httpClient := &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		},
	}

	// Use JSON client for enabling http proxy
	client := protos.NewAServiceJSONClient("http://localhost:8080", httpClient)

	resp, err := client.CallServiceA(context.Background(), &protos.GetServiceARequest{})
	if err != nil {
		log.Fatal(err)
	}

	for _, r := range resp.Responses {
		fmt.Printf("%s:%s\n", r.ServiceName, r.Status)
	}
}
