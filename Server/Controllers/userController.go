package Controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"Server/Models"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Database là đối tượng database đã được gán từ main.go
var Database *mongo.Database

func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var user Models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Kiểm tra độ dài mật khẩu
	if len(user.Password) < 8 {
		http.Error(w, "Mật khẩu phải có độ dài ít nhất 8 ký tự", http.StatusBadRequest)
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(user.Password), 10)
	user.Password = string(hash)

	// Đảm bảo email và phone là duy nhất
	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Kiểm tra email đã tồn tại
	count, _ := collection.CountDocuments(ctx, bson.M{"email": user.Email})
	if count > 0 {
		http.Error(w, "Email đã tồn tại", http.StatusBadRequest)
		return
	}

	// Kiểm tra phone đã tồn tại
	count, _ = collection.CountDocuments(ctx, bson.M{"phone": user.Phone})
	if count > 0 {
		http.Error(w, "Số điện thoại đã tồn tại", http.StatusBadRequest)
		return
	}

	// Set role mặc định là 2 (Customer)
	user.Role = Models.Customer

	result, _ := collection.InsertOne(ctx, user)
	json.NewEncoder(w).Encode(result)
}

func LoginUser(w http.ResponseWriter, r *http.Request) {
	var user Models.User
	var dbUser Models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := collection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&dbUser)
	if err != nil {
		http.Error(w, "Invalid email", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	// Trả về cả role
	response := struct {
		ID        primitive.ObjectID `json:"id"`
		FirstName string             `json:"firstname"`
		LastName  string             `json:"lastname"`
		Email     string             `json:"email"`
		Role      Models.Role        `json:"role"`
	}{
		ID:        dbUser.ID,
		FirstName: dbUser.FirstName,
		LastName:  dbUser.LastName,
		Email:     dbUser.Email,
		Role:      dbUser.Role,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []Models.User
	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var user Models.User
		if err := cursor.Decode(&user); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	// Formatting response with additional information
	response := struct {
		Count int           `json:"count"`
		Users []Models.User `json:"users"`
	}{
		Count: len(users),
		Users: users,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetUserByID(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, _ := primitive.ObjectIDFromHex(params["id"])

	var user Models.User
	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Formatting response
	response := struct {
		Success bool        `json:"success"`
		Message string      `json:"message"`
		User    Models.User `json:"user"`
	}{
		Success: true,
		Message: "User found",
		User:    user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, _ := primitive.ObjectIDFromHex(params["id"])

	var user Models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Update user
	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": user})
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	// Formatting response
	response := struct {
		Success  bool `json:"success"`
		Matched  int  `json:"matched_count"`
		Modified int  `json:"modified_count"`
	}{
		Success:  result.ModifiedCount > 0,
		Matched:  int(result.MatchedCount),
		Modified: int(result.ModifiedCount),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, _ := primitive.ObjectIDFromHex(params["id"])

	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode("User deleted successfully")
}
