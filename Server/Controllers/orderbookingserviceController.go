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
)

// Get collection for OrderBookingService
func getOrderBookingServiceCollection() *mongo.Collection {
	return Database.Collection("order_booking_service")
}

func getServiceCollection() *mongo.Collection {
	return Database.Collection("services")
}

func CreateOrderBookingService(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	var orderBookingService Models.OrderBookingService
	err := json.NewDecoder(r.Body).Decode(&orderBookingService)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	serviceCollection := getServiceCollection()
	var service Models.Service
	err = serviceCollection.FindOne(context.Background(), bson.M{"_id": orderBookingService.ServiceID}).Decode(&service)
	if err != nil {
		http.Error(w, "Service not found", http.StatusNotFound)
		return
	}

	orderBookingService.UserID = userID
	orderBookingService.TotalPrice = float64(orderBookingService.Quantity) * service.Price
	orderBookingService.Status = "Chờ xác nhận"
	orderBookingService.CreatedAt = primitive.NewDateTimeFromTime(time.Now())
	orderBookingService.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())
	orderBookingService.BookingDate = primitive.NewDateTimeFromTime(time.Now())

	// Lưu orderBookingService vào database
	orderBookingServiceCollection := getOrderBookingServiceCollection()
	_, err = orderBookingServiceCollection.InsertOne(context.Background(), orderBookingService)
	if err != nil {
		http.Error(w, "Failed to create order booking service", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orderBookingService)
}

// Get the bookings for the logged-in user
func GetOrderBookingServices(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("user").(*Middleware.UserClaims)
	userID := claims.ID

	// Fetch all order bookings related to the user
	orderBookingCollection := getOrderBookingServiceCollection()
	var orderBookings []Models.OrderBookingService
	cursor, err := orderBookingCollection.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		http.Error(w, "Failed to get order bookings", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	// Decode the order bookings into the response
	if err = cursor.All(context.Background(), &orderBookings); err != nil {
		http.Error(w, "Failed to decode order bookings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orderBookings)
}

func UpdateOrderBookingServiceStatus(w http.ResponseWriter, r *http.Request) {
	orderID := mux.Vars(r)["id"]

	var statusUpdate struct {
		Status string `json:"status"`
	}

	err := json.NewDecoder(r.Body).Decode(&statusUpdate)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if statusUpdate.Status != "Chờ xác nhận" && statusUpdate.Status != "Đã xác nhận" &&
		statusUpdate.Status != "Đang tiến hành" && statusUpdate.Status != "Hoàn thành" &&
		statusUpdate.Status != "Đã hủy" {
		http.Error(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	orderBookingServiceCollection := getOrderBookingServiceCollection()
	orderIDObj, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	update := bson.M{
		"$set": bson.M{
			"status":     statusUpdate.Status,
			"updated_at": primitive.NewDateTimeFromTime(time.Now()),
		},
	}

	_, err = orderBookingServiceCollection.UpdateOne(context.Background(), bson.M{"_id": orderIDObj}, update)
	if err != nil {
		http.Error(w, "Failed to update order status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Order status updated"})
}
