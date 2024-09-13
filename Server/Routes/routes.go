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

	return router
}
