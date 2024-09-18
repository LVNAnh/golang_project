package Controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"Server/Middleware"
	"Server/Models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Lấy collection cho đơn hàng
func getOrderCollection() *mongo.Collection {
	return Database.Collection("product_order")
}

// Tạo đơn hàng mới từ giỏ hàng
func CreateOrder(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	cartCollection := getCartCollection()
	var cart Models.Cart
	err := cartCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&cart)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	// Lấy thông tin sản phẩm từ giỏ hàng
	productCollection := getProductCollection()
	var orderItems []Models.OrderItem
	totalPrice := 0.0

	for _, cartItem := range cart.Items {
		var product Models.Product
		err := productCollection.FindOne(context.Background(), bson.M{"_id": cartItem.ProductID}).Decode(&product)
		if err != nil {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}

		// Tạo OrderItem từ CartItem và Product
		orderItem := Models.OrderItem{
			ProductID: cartItem.ProductID,
			Quantity:  cartItem.Quantity,
			Price:     product.Price,
			Name:      product.Name,
			ImageURL:  product.ImageURL,
		}

		orderItems = append(orderItems, orderItem)
		totalPrice += product.Price * float64(cartItem.Quantity)
	}

	// Tạo Order mới
	order := Models.Order{
		UserID:     userID,
		Items:      orderItems,
		TotalPrice: totalPrice,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	orderCollection := getOrderCollection()
	_, err = orderCollection.InsertOne(context.Background(), order)
	if err != nil {
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	// Sau khi tạo đơn hàng, xóa giỏ hàng của người dùng
	_, err = cartCollection.DeleteOne(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		http.Error(w, "Failed to clear cart", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

// Lấy danh sách đơn hàng của người dùng
func GetOrders(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	orderCollection := getOrderCollection()
	var orders []Models.Order
	cursor, err := orderCollection.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		http.Error(w, "Failed to get orders", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &orders); err != nil {
		http.Error(w, "Failed to decode orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}
