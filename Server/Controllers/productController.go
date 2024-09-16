package Controllers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"Server/Models"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Create a new product
// CreateProduct handles adding a new product
func CreateProduct(w http.ResponseWriter, r *http.Request) {
	var product Models.Product

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // Giới hạn kích thước file 10 MB
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	// Lấy file từ form
	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Could not get file from form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Tạo đường dẫn đến folder 'uploads/images'
	uploadPath := filepath.Join("uploads", "images")
	os.MkdirAll(uploadPath, os.ModePerm) // Tạo folder nếu chưa tồn tại

	// Tạo file với tên ban đầu của file tải lên
	filePath := filepath.Join(uploadPath, handler.Filename)
	tempFile, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Could not create file", http.StatusInternalServerError)
		return
	}
	defer tempFile.Close()

	// Copy nội dung của file tải lên vào file mới tạo
	_, err = io.Copy(tempFile, file)
	if err != nil {
		http.Error(w, "Could not save file", http.StatusInternalServerError)
		return
	}

	// Lưu đường dẫn tương đối tới hình ảnh vào database
	// Sử dụng dấu gạch chéo xuôi ('/') cho đường dẫn URL
	product.ImageURL = filepath.ToSlash(filepath.Join("/uploads/images", handler.Filename))

	// Lấy các thông tin khác từ form
	product.Name = r.FormValue("name")
	product.Price, _ = strconv.ParseFloat(r.FormValue("price"), 64)
	product.Stock, _ = strconv.Atoi(r.FormValue("stock"))
	product.ProductCategory, _ = primitive.ObjectIDFromHex(r.FormValue("productcategory"))

	// Validate product fields
	if product.Name == "" || product.Price <= 0 || product.Stock <= 0 {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Tạo ID mới cho sản phẩm
	product.ID = primitive.NewObjectID()

	// Lưu sản phẩm vào database
	collection := getCollection("products")
	_, err = collection.InsertOne(context.Background(), product)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// Get all products
func GetAllProducts(w http.ResponseWriter, r *http.Request) {
	var products []Models.Product
	collection := getCollection("products")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var product Models.Product
		cursor.Decode(&product)
		products = append(products, product)
	}

	// Set Content-Type and return the products as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// Get a product by ID
func GetProductByID(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var product Models.Product
	collection := getCollection("products")
	err = collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&product)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// Update a product by ID
func UpdateProduct(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var existingProduct Models.Product
	collection := getCollection("products")

	// Tìm sản phẩm hiện tại
	err = collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingProduct)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	// Parse multipart form
	err = r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	// Get file from form (nếu có file được tải lên)
	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()

		// Tạo đường dẫn đến folder uploads/images
		uploadPath := filepath.Join("uploads", "images")
		os.MkdirAll(uploadPath, os.ModePerm) // Đảm bảo folder tồn tại

		// Tạo file với tên ban đầu của file tải lên
		filePath := filepath.Join(uploadPath, handler.Filename)
		tempFile, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "Could not create file", http.StatusInternalServerError)
			return
		}
		defer tempFile.Close()

		// Copy nội dung của file tải lên vào file mới tạo
		_, err = io.Copy(tempFile, file)
		if err != nil {
			http.Error(w, "Could not save file", http.StatusInternalServerError)
			return
		}

		// Cập nhật đường dẫn ảnh
		existingProduct.ImageURL = filePath
	}

	// Cập nhật các trường khác từ form
	if name := r.FormValue("name"); name != "" {
		existingProduct.Name = name
	}
	if price, err := strconv.ParseFloat(r.FormValue("price"), 64); err == nil && price > 0 {
		existingProduct.Price = price
	}
	if stock, err := strconv.Atoi(r.FormValue("stock")); err == nil && stock >= 0 {
		existingProduct.Stock = stock
	}
	if category := r.FormValue("productcategory"); category != "" {
		if productCategory, err := primitive.ObjectIDFromHex(category); err == nil {
			existingProduct.ProductCategory = productCategory
		}
	}

	// Validate các trường của sản phẩm
	if existingProduct.Name == "" || existingProduct.Price <= 0 || existingProduct.Stock <= 0 {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Cập nhật sản phẩm trong database
	update := bson.M{
		"$set": bson.M{
			"name":            existingProduct.Name,
			"price":           existingProduct.Price,
			"stock":           existingProduct.Stock,
			"productcategory": existingProduct.ProductCategory,
			"imageurl":        existingProduct.ImageURL,
		},
	}

	result, err := collection.UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existingProduct)
}

// Delete a product by ID
func DeleteProduct(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	collection := getCollection("products")
	result, err := collection.DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
