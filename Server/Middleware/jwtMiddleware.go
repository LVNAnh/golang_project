package Middleware

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Lấy JWT_SECRET từ biến môi trường hoặc gán thủ công nếu cần
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

type Role int

const (
	Admin Role = iota
	Staff
	Customer
)

// UserClaims struct để lưu thông tin người dùng vào JWT token
type UserClaims struct {
	ID   primitive.ObjectID `json:"id"`
	Role Role               `json:"role"`
	jwt.StandardClaims
}

// Middleware kiểm tra JWT token
func AuthMiddleware(next http.Handler, requiredRole Role) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Lấy JWT token từ header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header missing", http.StatusUnauthorized)
			return
		}

		// Format header: "Bearer <token>"
		tokenString := strings.TrimSpace(strings.Replace(authHeader, "Bearer", "", 1))

		// Kiểm tra token có hợp lệ không
		claims := &UserClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Kiểm tra quyền (role) của người dùng
		if claims.Role > requiredRole {
			http.Error(w, "You do not have permission to access this resource", http.StatusForbidden)
			return
		}

		// Đặt thông tin người dùng vào context để có thể truy xuất sau này
		ctx := context.WithValue(r.Context(), "user", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GenerateJWT tạo JWT token cho người dùng sau khi đăng nhập thành công
func GenerateJWT(userID primitive.ObjectID, role Role) (string, error) {
	// Thời gian hết hạn của token, ở đây là 24 giờ
	expirationTime := time.Now().Add(24 * time.Hour)

	// Tạo claims chứa thông tin người dùng
	claims := &UserClaims{
		ID:   userID,
		Role: role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	// Tạo token với phương thức ký là HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Ký token bằng jwtSecret
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
