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

// Create a new service
func CreateService(w http.ResponseWriter, r *http.Request) {
	var service Models.Service

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Could not get file from form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Upload path for the image
	uploadPath := filepath.Join("uploads", "images")
	os.MkdirAll(uploadPath, os.ModePerm)

	// Save file
	filePath := filepath.Join(uploadPath, handler.Filename)
	tempFile, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Could not create file", http.StatusInternalServerError)
		return
	}
	defer tempFile.Close()

	_, err = io.Copy(tempFile, file)
	if err != nil {
		http.Error(w, "Could not save file", http.StatusInternalServerError)
		return
	}

	// Save image URL
	service.ImageURL = filepath.ToSlash(filepath.Join("/uploads/images", handler.Filename))

	// Get other form values
	service.Name = r.FormValue("name")
	service.Price, _ = strconv.ParseFloat(r.FormValue("price"), 64)
	service.Description = r.FormValue("description")
	service.ServiceCategory, _ = primitive.ObjectIDFromHex(r.FormValue("servicecategory"))

	// Validate fields
	if service.Name == "" || service.Price <= 0 {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Set ID
	service.ID = primitive.NewObjectID()

	// Insert service into the database
	collection := getCollection("services")
	_, err = collection.InsertOne(context.Background(), service)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(service)
}

// Get all services
func GetAllServices(w http.ResponseWriter, r *http.Request) {
	var services []Models.Service
	collection := getCollection("services")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var service Models.Service
		cursor.Decode(&service)
		services = append(services, service)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(services)
}

// Get a service by ID
func GetServiceByID(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var service Models.Service
	collection := getCollection("services")
	err = collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&service)
	if err != nil {
		http.Error(w, "Service not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(service)
}

// Update a service by ID
func UpdateService(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var existingService Models.Service
	collection := getCollection("services")

	// Find the service to update
	err = collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingService)
	if err != nil {
		http.Error(w, "Service not found", http.StatusNotFound)
		return
	}

	// Parse multipart form
	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	// Handle file upload if present
	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()

		uploadPath := filepath.Join("uploads", "images")
		os.MkdirAll(uploadPath, os.ModePerm)

		filePath := filepath.Join(uploadPath, handler.Filename)
		tempFile, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "Could not create file", http.StatusInternalServerError)
			return
		}
		defer tempFile.Close()

		_, err = io.Copy(tempFile, file)
		if err != nil {
			http.Error(w, "Could not save file", http.StatusInternalServerError)
			return
		}

		// Update image URL
		existingService.ImageURL = filePath
	}

	// Update fields from form
	if name := r.FormValue("name"); name != "" {
		existingService.Name = name
	}
	if price, err := strconv.ParseFloat(r.FormValue("price"), 64); err == nil && price > 0 {
		existingService.Price = price
	}
	if description := r.FormValue("description"); description != "" {
		existingService.Description = description
	}
	if category := r.FormValue("servicecategory"); category != "" {
		if serviceCategory, err := primitive.ObjectIDFromHex(category); err == nil {
			existingService.ServiceCategory = serviceCategory
		}
	}

	// Validate fields
	if existingService.Name == "" || existingService.Price <= 0 {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Update in database
	update := bson.M{
		"$set": bson.M{
			"name":            existingService.Name,
			"price":           existingService.Price,
			"description":     existingService.Description,
			"servicecategory": existingService.ServiceCategory,
			"imageurl":        existingService.ImageURL,
		},
	}

	result, err := collection.UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Service not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existingService)
}

// Delete a service by ID
func DeleteService(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	collection := getCollection("services")
	result, err := collection.DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Service not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
