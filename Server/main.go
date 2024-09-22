package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"Server/Controllers"
	"Server/Routes"

	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client := &mongo.Client{}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Could not connect to MongoDB: ", err)
	}

	database := client.Database("golang_project")

	Controllers.Database = database

	router := Routes.SetupRoutes()

	router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:6969"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With"},
		ExposedHeaders:   []string{"Authorization"},
		AllowCredentials: true,
		MaxAge:           3600,
	}).Handler(router)

	port := "8080"

	fmt.Printf("Chương trình đang hoạt động tại localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
