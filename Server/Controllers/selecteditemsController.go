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

// Lấy collection selected_items
func getSelectedItemsCollection() *mongo.Collection {
	return Database.Collection("selected_items")
}

// Thêm sản phẩm vào SelectedItems
func AddToSelectedItems(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var selectedItem Models.SelectedItem
	err := json.NewDecoder(r.Body).Decode(&selectedItem)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Tìm kiếm thông tin sản phẩm từ collection products
	productCollection := getProductCollection()
	var product Models.Product
	err = productCollection.FindOne(context.Background(), bson.M{"_id": selectedItem.ProductID}).Decode(&product)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	// Bổ sung thêm tên và imageURL vào selectedItem
	selectedItem.Name = product.Name
	selectedItem.ImageURL = product.ImageURL

	// Tìm kiếm hoặc tạo mới selected_items
	collection := getSelectedItemsCollection()
	var selectedItems Models.SelectedItems
	err = collection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&selectedItems)

	if err == mongo.ErrNoDocuments {
		// Tạo mới danh sách selected items
		selectedItems = Models.SelectedItems{
			UserID:    userID,
			Items:     []Models.SelectedItem{selectedItem},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err = collection.InsertOne(context.Background(), selectedItems)
	} else {
		// Cập nhật selected_items nếu đã tồn tại
		exists := false
		for i, item := range selectedItems.Items {
			if item.ProductID == selectedItem.ProductID {
				selectedItems.Items[i].Quantity += selectedItem.Quantity
				exists = true
				break
			}
		}
		if !exists {
			selectedItems.Items = append(selectedItems.Items, selectedItem)
		}
		selectedItems.UpdatedAt = time.Now()
		_, err = collection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": selectedItems})
	}

	if err != nil {
		http.Error(w, "Failed to add to selected items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(selectedItems)
}

// Lấy danh sách sản phẩm đã chọn (SelectedItems)
func GetSelectedItems(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	collection := getSelectedItemsCollection()
	var selectedItems Models.SelectedItems
	err := collection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&selectedItems)

	if err != nil {
		http.Error(w, "Selected items not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(selectedItems)
}

// Cập nhật số lượng sản phẩm trong SelectedItems
func UpdateSelectedItems(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var selectedItem Models.SelectedItem
	err := json.NewDecoder(r.Body).Decode(&selectedItem)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	collection := getSelectedItemsCollection()
	var selectedItems Models.SelectedItems
	err = collection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&selectedItems)
	if err != nil {
		http.Error(w, "Selected items not found", http.StatusNotFound)
		return
	}

	// Cập nhật số lượng sản phẩm
	for i, item := range selectedItems.Items {
		if item.ProductID == selectedItem.ProductID {
			selectedItems.Items[i].Quantity = selectedItem.Quantity
			break
		}
	}
	selectedItems.UpdatedAt = time.Now()

	_, err = collection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": selectedItems})

	if err != nil {
		http.Error(w, "Failed to update selected items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(selectedItems)
}

// Xóa sản phẩm khỏi SelectedItems khi user uncheck
func RemoveFromSelectedItems(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var selectedItem Models.SelectedItem
	err := json.NewDecoder(r.Body).Decode(&selectedItem)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	collection := getSelectedItemsCollection()
	var selectedItems Models.SelectedItems
	err = collection.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&selectedItems)
	if err != nil {
		http.Error(w, "Selected items not found", http.StatusNotFound)
		return
	}

	// Xóa sản phẩm khỏi danh sách selected_items
	for i, item := range selectedItems.Items {
		if item.ProductID == selectedItem.ProductID {
			selectedItems.Items = append(selectedItems.Items[:i], selectedItems.Items[i+1:]...)
			break
		}
	}

	// Cập nhật lại selected_items sau khi xóa
	if len(selectedItems.Items) == 0 {
		_, err = collection.DeleteOne(context.Background(), bson.M{"user_id": userID})
	} else {
		selectedItems.UpdatedAt = time.Now()
		_, err = collection.UpdateOne(context.Background(), bson.M{"user_id": userID}, bson.M{"$set": selectedItems})
	}

	if err != nil {
		http.Error(w, "Failed to update selected items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Product removed from selected items",
		"items":   selectedItems, // Trả về danh sách đã cập nhật
	})
}

// Xóa toàn bộ sản phẩm trong SelectedItems sau khi đặt hàng thành công
func ClearSelectedItems(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	collection := getSelectedItemsCollection()
	_, err := collection.DeleteOne(context.Background(), bson.M{"user_id": userID})

	if err != nil {
		http.Error(w, "Failed to clear selected items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Selected items cleared",
	})
}
