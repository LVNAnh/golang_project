package Controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"Server/Middleware"
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

	// Trả về phản hồi không có ID, email, và role
	response := struct {
		Success bool `json:"success"`
	}{
		Success: result.InsertedID != nil,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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

	// Chuyển đổi role từ Models.Role sang Middleware.Role
	middlewareRole := Middleware.Role(dbUser.Role)

	// Tạo JWT token và sử dụng dbUser.ID trực tiếp
	token, err := Middleware.GenerateJWT(dbUser.ID, middlewareRole)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Trả về token và thông tin người dùng
	response := struct {
		Token     string      `json:"token"`
		FirstName string      `json:"firstname"`
		LastName  string      `json:"lastname"`
		Role      Models.Role `json:"role"`
	}{
		Token:     token,
		FirstName: dbUser.FirstName,
		LastName:  dbUser.LastName,
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
	// Lấy user ID từ JWT claims
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	// Lấy ID từ URL (id của user muốn cập nhật)
	params := mux.Vars(r)
	requestedID, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	// So sánh userID từ JWT với requestedID
	if userID != requestedID {
		http.Error(w, "You are not allowed to update this user", http.StatusForbidden)
		return
	}

	// Tiếp tục xử lý cập nhật thông tin
	var user Models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Cập nhật thông tin người dùng
	result, err := collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$set": user})
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	// Định dạng phản hồi
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
