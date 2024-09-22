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

// Lấy collection giỏ hàng
func getCartCollection() *mongo.Collection {
	return Database.Collection("carts")
}

// Lấy collection sản phẩm
func getProductCollection() *mongo.Collection {
	return Database.Collection("products")
}

// Thêm sản phẩm vào giỏ hàng
func AddToCart(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var cartItem Models.CartItem
	err := json.NewDecoder(r.Body).Decode(&cartItem)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	cartCollection := getCartCollection()
	var cart Models.Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&cart)

	if err == mongo.ErrNoDocuments {
		// Nếu không có giỏ hàng, tạo mới giỏ hàng cho user
		cart = Models.Cart{
			UserID:    userID,
			Items:     []Models.CartItem{cartItem},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err = cartCollection.InsertOne(context.Background(), cart)
	} else {
		// Nếu giỏ hàng đã tồn tại, thêm sản phẩm vào giỏ hàng
		exists := false
		for i, item := range cart.Items {
			if item.ProductID == cartItem.ProductID {
				// Nếu sản phẩm đã có trong giỏ hàng, tăng số lượng
				cart.Items[i].Quantity += cartItem.Quantity
				exists = true
				break
			}
		}
		if !exists {
			// Thêm sản phẩm mới vào giỏ hàng
			cart.Items = append(cart.Items, cartItem)
		}
		cart.UpdatedAt = time.Now()
		_, err = cartCollection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": cart})
	}

	if err != nil {
		http.Error(w, "Failed to add to cart", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cart)
}

// Lấy giỏ hàng của người dùng và bao gồm thông tin chi tiết sản phẩm
func GetCart(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	cartCollection := getCartCollection()
	var cart Models.Cart
	err := cartCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&cart)

	if err != nil {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	// Lấy thêm thông tin sản phẩm từ collection products
	productCollection := getProductCollection()
	for i, item := range cart.Items {
		var product Models.Product
		// Tìm sản phẩm bằng product_id
		err := productCollection.FindOne(context.Background(), bson.M{"_id": item.ProductID}).Decode(&product)
		if err != nil {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}

		// Gắn thông tin chi tiết sản phẩm vào từng item trong giỏ hàng
		cart.Items[i].Name = product.Name
		cart.Items[i].Price = product.Price
		cart.Items[i].ImageURL = product.ImageURL
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cart)
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
func UpdateCart(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var cartItem Models.CartItem
	err := json.NewDecoder(r.Body).Decode(&cartItem)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	cartCollection := getCartCollection()
	var cart Models.Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&cart)
	if err != nil {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	// Cập nhật số lượng sản phẩm trong giỏ hàng
	for i, item := range cart.Items {
		if item.ProductID == cartItem.ProductID {
			cart.Items[i].Quantity = cartItem.Quantity
			break
		}
	}

	cart.UpdatedAt = time.Now()
	_, err = cartCollection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": cart})

	if err != nil {
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cart)
}

// Xóa sản phẩm khỏi giỏ hàng
func RemoveFromCart(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var cartItem Models.CartItem
	err := json.NewDecoder(r.Body).Decode(&cartItem)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	cartCollection := getCartCollection()
	var cart Models.Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&cart)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	// Xóa sản phẩm khỏi giỏ hàng
	productRemoved := false
	for i, item := range cart.Items {
		if item.ProductID == cartItem.ProductID {
			cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
			productRemoved = true
			break
		}
	}

	if !productRemoved {
		http.Error(w, "Product not found in cart", http.StatusBadRequest)
		return
	}

	// Nếu giỏ hàng rỗng sau khi xóa sản phẩm, có thể xóa luôn giỏ hàng nếu cần
	if len(cart.Items) == 0 {
		_, err = cartCollection.DeleteOne(context.Background(), bson.M{"user_id": userID})
		if err != nil {
			http.Error(w, "Failed to delete cart", http.StatusInternalServerError)
			return
		}
	} else {
		cart.UpdatedAt = time.Now()
		_, err = cartCollection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": cart})
		if err != nil {
			http.Error(w, "Failed to update cart", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Product removed from cart",
		"cart":    cart, // Trả về giỏ hàng mới đã cập nhật
	})
}
