package Routes

import (
	"Server/Controllers"
	"Server/Middleware"
	"net/http"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	// User routes
	router.HandleFunc("/register", Controllers.RegisterUser).Methods("POST")
	router.HandleFunc("/login", Controllers.LoginUser).Methods("POST")
	router.HandleFunc("/users", Controllers.GetAllUsers).Methods("GET")
	router.HandleFunc("/user/{id}", Controllers.GetUserByID).Methods("GET")
	router.Handle("/user/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.UpdateUser), Middleware.Admin)).Methods("PUT")
	router.Handle("/user/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.DeleteUser), Middleware.Admin)).Methods("DELETE")

	// ProductCategory routes
	router.HandleFunc("/productcategories", Controllers.GetAllProductCategories).Methods("GET")
	router.HandleFunc("/productcategory/{id}", Controllers.GetProductCategoryByID).Methods("GET")
	router.Handle("/productcategory", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.CreateProductCategory), Middleware.Admin)).Methods("POST")
	router.Handle("/productcategory/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.UpdateProductCategory), Middleware.Admin)).Methods("PUT")
	router.Handle("/productcategory/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.DeleteProductCategory), Middleware.Admin)).Methods("DELETE")

	// Product routes
	router.HandleFunc("/products", Controllers.GetAllProducts).Methods("GET")
	router.HandleFunc("/product/{id}", Controllers.GetProductByID).Methods("GET")
	router.Handle("/product", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.CreateProduct), Middleware.Staff)).Methods("POST")
	router.Handle("/product/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.UpdateProduct), Middleware.Staff)).Methods("PUT")
	router.Handle("/product/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.DeleteProduct), Middleware.Staff)).Methods("DELETE")

	// ServiceCategory routes
	router.HandleFunc("/servicecategories", Controllers.GetAllServiceCategories).Methods("GET")
	router.HandleFunc("/servicecategory/{id}", Controllers.GetServiceCategoryByID).Methods("GET")
	router.Handle("/servicecategory", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.CreateServiceCategory), Middleware.Admin)).Methods("POST")
	router.Handle("/servicecategory/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.UpdateServiceCategory), Middleware.Admin)).Methods("PUT")
	router.Handle("/servicecategory/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.DeleteServiceCategory), Middleware.Admin)).Methods("DELETE")

	// Service routes
	router.HandleFunc("/services", Controllers.GetAllServices).Methods("GET")
	router.HandleFunc("/service/{id}", Controllers.GetServiceByID).Methods("GET")
	router.Handle("/service", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.CreateService), Middleware.Staff)).Methods("POST")
	router.Handle("/service/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.UpdateService), Middleware.Staff)).Methods("PUT")
	router.Handle("/service/{id}", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.DeleteService), Middleware.Staff)).Methods("DELETE")

	// Cart routes
	router.Handle("/cart", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.GetCart), Middleware.Customer)).Methods("GET")
	router.Handle("/cart/add", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.AddToCart), Middleware.Customer)).Methods("POST")
	router.Handle("/cart/remove", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.RemoveFromCart), Middleware.Customer)).Methods("DELETE")
	router.Handle("/cart/update", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.UpdateCart), Middleware.Customer)).Methods("POST")

	// Order routes
	router.Handle("/order", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.CreateOrder), Middleware.Customer)).Methods("POST") // Tạo đơn hàng
	router.Handle("/orders", Middleware.AuthMiddleware(http.HandlerFunc(Controllers.GetOrders), Middleware.Customer)).Methods("GET")   // Lấy danh sách đơn hàng của người dùng

	return router
}
