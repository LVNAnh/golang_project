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
	// Khởi tạo MongoDB client
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client := &mongo.Client{}

	// Kết nối đến MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	// Đảm bảo kết nối thành công
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Could not connect to MongoDB: ", err)
	}

	// Lấy đối tượng Database
	database := client.Database("golang_project")

	// Gán database cho controller
	Controllers.Database = database

	// Thiết lập các route
	router := Routes.SetupRoutes()

	// Cấu hình CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:6969"},                   // Thay bằng URL frontend
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, // Cho phép các phương thức PUT, DELETE
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	// Xác định cổng cho server
	port := "8080"

	// Khởi chạy server với CORS middleware
	fmt.Printf("Chương trình đang hoạt động tại localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
