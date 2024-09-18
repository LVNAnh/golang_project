package Controllers

import (
	"context"
	"encoding/json"
	"net/http"

	"Server/Middleware" // Import middleware để sử dụng JWT
	"Server/Models"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Collection getter
func getServiceCategoryCollection() *mongo.Collection {
	return Database.Collection("service_categories")
}

// Create a new service category
func CreateServiceCategory(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims) // Lấy thông tin người dùng từ context
	if claims.Role != Middleware.Admin && claims.Role != Middleware.Staff {
		http.Error(w, "Permission denied", http.StatusForbidden)
		return
	}

	var serviceCategory Models.ServiceCategory
	err := json.NewDecoder(r.Body).Decode(&serviceCategory)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	serviceCategory.ID = primitive.NewObjectID()

	collection := getServiceCategoryCollection()
	_, err = collection.InsertOne(context.Background(), serviceCategory)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serviceCategory)
}

// Get all service categories
func GetAllServiceCategories(w http.ResponseWriter, r *http.Request) {
	var serviceCategories []Models.ServiceCategory
	collection := getServiceCategoryCollection()
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var serviceCategory Models.ServiceCategory
		cursor.Decode(&serviceCategory)
		serviceCategories = append(serviceCategories, serviceCategory)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serviceCategories)
}

// Get a service category by ID
func GetServiceCategoryByID(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var serviceCategory Models.ServiceCategory
	collection := getServiceCategoryCollection()
	err = collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&serviceCategory)
	if err != nil {
		http.Error(w, "Service category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serviceCategory)
}

// Update a service category by ID
func UpdateServiceCategory(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims) // Lấy thông tin người dùng từ context
	if claims.Role != Middleware.Admin && claims.Role != Middleware.Staff {
		http.Error(w, "Permission denied", http.StatusForbidden)
		return
	}

	params := mux.Vars(r)
	id := params["id"]

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var serviceCategory Models.ServiceCategory
	err = json.NewDecoder(r.Body).Decode(&serviceCategory)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := getServiceCategoryCollection()
	update := bson.M{"$set": bson.M{
		"name":        serviceCategory.Name,
		"description": serviceCategory.Description,
	}}
	result, err := collection.UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Service category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serviceCategory)
}

// Delete a service category by ID
func DeleteServiceCategory(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims) // Lấy thông tin người dùng từ context
	if claims.Role != Middleware.Admin && claims.Role != Middleware.Staff {
		http.Error(w, "Permission denied", http.StatusForbidden)
		return
	}

	params := mux.Vars(r)
	id := params["id"]

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	collection := getServiceCategoryCollection()
	result, err := collection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Service category not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
