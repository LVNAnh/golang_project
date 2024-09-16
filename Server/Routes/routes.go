package Routes

import (
	"Server/Controllers"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	// User routes
	router.HandleFunc("/register", Controllers.RegisterUser).Methods("POST")
	router.HandleFunc("/login", Controllers.LoginUser).Methods("POST")
	router.HandleFunc("/users", Controllers.GetAllUsers).Methods("GET")
	router.HandleFunc("/user/{id}", Controllers.GetUserByID).Methods("GET")
	router.HandleFunc("/user/{id}", Controllers.UpdateUser).Methods("PUT")
	router.HandleFunc("/user/{id}", Controllers.DeleteUser).Methods("DELETE")

	// ProductCategory routes
	router.HandleFunc("/productcategories", Controllers.GetAllProductCategories).Methods("GET")
	router.HandleFunc("/productcategory/{id}", Controllers.GetProductCategoryByID).Methods("GET")
	router.HandleFunc("/productcategory", Controllers.CreateProductCategory).Methods("POST")
	router.HandleFunc("/productcategory/{id}", Controllers.UpdateProductCategory).Methods("PUT")
	router.HandleFunc("/productcategory/{id}", Controllers.DeleteProductCategory).Methods("DELETE")

	// Product routes
	router.HandleFunc("/products", Controllers.GetAllProducts).Methods("GET")
	router.HandleFunc("/product/{id}", Controllers.GetProductByID).Methods("GET")
	router.HandleFunc("/product", Controllers.CreateProduct).Methods("POST")
	router.HandleFunc("/product/{id}", Controllers.UpdateProduct).Methods("PUT")
	router.HandleFunc("/product/{id}", Controllers.DeleteProduct).Methods("DELETE")

	// ServiceCategory routes
	router.HandleFunc("/servicecategories", Controllers.GetAllServiceCategories).Methods("GET")
	router.HandleFunc("/servicecategory/{id}", Controllers.GetServiceCategoryByID).Methods("GET")
	router.HandleFunc("/servicecategory", Controllers.CreateServiceCategory).Methods("POST")
	router.HandleFunc("/servicecategory/{id}", Controllers.UpdateServiceCategory).Methods("PUT")
	router.HandleFunc("/servicecategory/{id}", Controllers.DeleteServiceCategory).Methods("DELETE")

	// Service routes
	router.HandleFunc("/services", Controllers.GetAllServices).Methods("GET")
	router.HandleFunc("/service/{id}", Controllers.GetServiceByID).Methods("GET")
	router.HandleFunc("/service", Controllers.CreateService).Methods("POST")
	router.HandleFunc("/service/{id}", Controllers.UpdateService).Methods("PUT")
	router.HandleFunc("/service/{id}", Controllers.DeleteService).Methods("DELETE")

	return router
}
