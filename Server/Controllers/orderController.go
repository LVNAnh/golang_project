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

// Tạo đơn hàng mới từ selected_items
func CreateOrder(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	// Lấy các sản phẩm từ selected_items
	selectedItemsCollection := getSelectedItemsCollection()
	var selectedItems Models.SelectedItems
	err := selectedItemsCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&selectedItems)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "No selected items found", http.StatusNotFound)
		return
	}

	// Lấy thông tin sản phẩm từ selected_items
	productCollection := getProductCollection()
	var orderItems []Models.OrderItem
	totalPrice := 0.0

	for _, selectedItem := range selectedItems.Items {
		var product Models.Product
		err := productCollection.FindOne(context.Background(), bson.M{"_id": selectedItem.ProductID}).Decode(&product)
		if err != nil {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}

		// Tạo OrderItem từ SelectedItem và Product
		orderItem := Models.OrderItem{
			ProductID: selectedItem.ProductID,
			Quantity:  selectedItem.Quantity,
			Price:     product.Price,
			Name:      product.Name,
			ImageURL:  product.ImageURL,
		}

		orderItems = append(orderItems, orderItem)
		totalPrice += product.Price * float64(selectedItem.Quantity)
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

	// Sau khi tạo đơn hàng thành công, gọi API để xóa sản phẩm đã chọn khỏi giỏ hàng
	cartCollection := getCartCollection()
	var cart Models.Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&cart)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	// Xóa các sản phẩm đã được chọn ra khỏi giỏ hàng
	for _, selectedItem := range selectedItems.Items {
		for i, cartItem := range cart.Items {
			if selectedItem.ProductID == cartItem.ProductID {
				// Xóa sản phẩm khỏi giỏ hàng
				cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
				break
			}
		}
	}

	// Cập nhật giỏ hàng sau khi xóa các sản phẩm
	if len(cart.Items) == 0 {
		_, err = cartCollection.DeleteOne(context.Background(), bson.M{"user_id": userID})
	} else {
		cart.UpdatedAt = time.Now()
		_, err = cartCollection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": cart})
	}

	if err != nil {
		http.Error(w, "Failed to update cart after order", http.StatusInternalServerError)
		return
	}

	// Sau khi tạo đơn hàng, xóa selected_items của người dùng
	_, err = selectedItemsCollection.DeleteOne(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		http.Error(w, "Failed to clear selected items", http.StatusInternalServerError)
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
