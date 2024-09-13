package Controllers

import (
	"context"
	"encoding/json"
	"net/http"

	"Server/Models"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Create a new product
// CreateProduct handles adding a new product
func CreateProduct(w http.ResponseWriter, r *http.Request) {
	var product Models.Product
	err := json.NewDecoder(r.Body).Decode(&product)
	if err != nil || product.Name == "" || product.Price <= 0 || product.Stock <= 0 {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Tạo ID mới cho sản phẩm
	product.ID = primitive.NewObjectID()

	// Lưu sản phẩm vào cơ sở dữ liệu
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

	var product Models.Product
	err = json.NewDecoder(r.Body).Decode(&product)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Kiểm tra productcategory ID có hợp lệ không
	product.ProductCategory, err = primitive.ObjectIDFromHex(product.ProductCategory.Hex())
	if err != nil {
		http.Error(w, "Invalid ProductCategory ID", http.StatusBadRequest)
		return
	}

	collection := getCollection("products")
	update := bson.M{
		"$set": bson.M{
			"name":            product.Name,
			"price":           product.Price,
			"stock":           product.Stock,
			"productcategory": product.ProductCategory,
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
	json.NewEncoder(w).Encode(product)
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
