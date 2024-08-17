package main

import (
	"fmt"
	"log"
	"net/http"

	"Golang_project/Controllers"
	"Golang_project/Routes"
)

func main() {
	// Khởi tạo MongoDB client và gán cho biến xuất khẩu
	Controllers.Client = Controllers.InitMongoClient()

	// Thiết lập các route
	router := Routes.SetupRoutes()

	// Xác định cổng cho server
	port := "8080"

	// Khởi chạy server
	fmt.Printf("Chương trình đang hoạt động tại localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
