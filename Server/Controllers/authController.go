package Controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"Server/Models"

	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// JWT secret keys
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))
var jwtRefreshSecret = []byte(os.Getenv("JWT_REFRESH_SECRET"))

// Struct để chứa Access Token và Refresh Token
type TokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

// Login handler: Đăng nhập và tạo access token, refresh token
func Login(w http.ResponseWriter, r *http.Request) {
	var user Models.User
	var dbUser Models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Kiểm tra email có tồn tại hay không
	err := collection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&dbUser)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	// So sánh mật khẩu đã mã hóa
	err = bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	// Tạo accessToken và refreshToken
	accessToken, err := createToken(dbUser.ID.Hex(), dbUser.Role, 15*time.Minute, jwtSecret)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := createToken(dbUser.ID.Hex(), dbUser.Role, 7*24*time.Hour, jwtRefreshSecret)
	if err != nil {
		http.Error(w, "Failed to create refresh token", http.StatusInternalServerError)
		return
	}

	// Trả về access token và refresh token
	response := TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Register handler: Đăng ký tài khoản mới và tạo token
func Register(w http.ResponseWriter, r *http.Request) {
	var user Models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Kiểm tra mật khẩu có độ dài tối thiểu
	if len(user.Password) < 8 {
		http.Error(w, "Password must be at least 8 characters long", http.StatusBadRequest)
		return
	}

	// Mã hóa mật khẩu
	hash, _ := bcrypt.GenerateFromPassword([]byte(user.Password), 10)
	user.Password = string(hash)

	// Đảm bảo email duy nhất
	collection := Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, _ := collection.CountDocuments(ctx, bson.M{"email": user.Email})
	if count > 0 {
		http.Error(w, "Email already exists", http.StatusBadRequest)
		return
	}

	// Set role mặc định cho user
	user.Role = Models.Customer
	user.ID = primitive.NewObjectID()

	_, err := collection.InsertOne(ctx, user)
	if err != nil {
		http.Error(w, "Error saving user", http.StatusInternalServerError)
		return
	}

	// Tạo accessToken và refreshToken sau khi đăng ký thành công
	accessToken, err := createToken(user.ID.Hex(), user.Role, 15*time.Minute, jwtSecret)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := createToken(user.ID.Hex(), user.Role, 7*24*time.Hour, jwtRefreshSecret)
	if err != nil {
		http.Error(w, "Failed to create refresh token", http.StatusInternalServerError)
		return
	}

	response := TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Refresh token handler: Tạo access token mới từ refresh token
func RefreshToken(w http.ResponseWriter, r *http.Request) {
	var reqBody struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Kiểm tra tính hợp lệ của refresh token
	token, err := jwt.Parse(reqBody.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return jwtRefreshSecret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// Tạo access token mới nếu refresh token hợp lệ
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userId := claims["sub"].(string)
		role := claims["role"].(float64)

		// Tạo access token mới
		accessToken, err := createToken(userId, Models.Role(role), 15*time.Minute, jwtSecret)
		if err != nil {
			http.Error(w, "Failed to create new token", http.StatusInternalServerError)
			return
		}

		response := TokenResponse{
			AccessToken:  accessToken,
			RefreshToken: reqBody.RefreshToken, // Giữ nguyên refresh token
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	} else {
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
	}
}

// Helper function: Tạo JWT token
func createToken(userID string, role Models.Role, duration time.Duration, secret []byte) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(duration).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}
