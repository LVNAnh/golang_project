package Controllers

import (
	"context"
	"encoding/json"
	"net/http"

	"Server/Models"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Collection getter
func getCollection(name string) *mongo.Collection {
	return Database.Collection(name)
}

// Create a new product category
func CreateProductCategory(w http.ResponseWriter, r *http.Request) {
	var productCategory Models.ProductCategory
	err := json.NewDecoder(r.Body).Decode(&productCategory)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	productCategory.ID = primitive.NewObjectID()

	collection := getCollection("product_categories")
	_, err = collection.InsertOne(context.Background(), productCategory)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(productCategory)
}

// Get all product categories
func GetAllProductCategories(w http.ResponseWriter, r *http.Request) {
	var productCategories []Models.ProductCategory
	collection := getCollection("product_categories")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var productCategory Models.ProductCategory
		cursor.Decode(&productCategory)
		productCategories = append(productCategories, productCategory)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(productCategories)
}

// Get a product category by ID
func GetProductCategoryByID(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var productCategory Models.ProductCategory
	collection := getCollection("product_categories")
	err = collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&productCategory)
	if err != nil {
		http.Error(w, "Product category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(productCategory)
}

// Update a product category by ID
func UpdateProductCategory(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"] // Lấy ID từ URL

	// Chuyển đổi ID từ chuỗi sang ObjectID
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	// Sử dụng objectID cho các truy vấn tiếp theo
	var productCategory Models.ProductCategory
	err = json.NewDecoder(r.Body).Decode(&productCategory)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := getCollection("product_categories")
	update := bson.M{"$set": bson.M{
		"name":        productCategory.Name,
		"description": productCategory.Description,
	}}
	result, err := collection.UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Product category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(productCategory)
}

// Delete a product category by ID
func DeleteProductCategory(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"] // Lấy ID từ URL

	// Chuyển đổi ID từ chuỗi sang ObjectID
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	collection := getCollection("product_categories")
	result, err := collection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Product category not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent) // Trả về 204 No Content nếu xóa thành công
}
