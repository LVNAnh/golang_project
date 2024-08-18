package main

import (
	"fmt"
	"log"
	"net/http"

	"Server/Controllers"
	"Server/Routes"

	"github.com/rs/cors"
)

func main() {
	// Khởi tạo MongoDB client và gán cho biến xuất khẩu
	Controllers.Client = Controllers.InitMongoClient()

	// Thiết lập các route
	router := Routes.SetupRoutes()

	// Cấu hình CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:6969"}, // Thay bằng URL frontend
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	// Xác định cổng cho server
	port := "8080"

	// Khởi chạy server với CORS middleware
	fmt.Printf("Chương trình đang hoạt động tại localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
