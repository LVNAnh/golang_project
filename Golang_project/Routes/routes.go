package Routes

import (
	"Golang_project/Controllers"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	router := mux.NewRouter()
	router.HandleFunc("/register", Controllers.RegisterUser).Methods("POST")
	router.HandleFunc("/login", Controllers.LoginUser).Methods("POST")
	router.HandleFunc("/users", Controllers.GetAllUsers).Methods("GET")
	router.HandleFunc("/user/{id}", Controllers.GetUserByID).Methods("GET")
	router.HandleFunc("/user/{id}", Controllers.UpdateUser).Methods("PUT")
	router.HandleFunc("/user/{id}", Controllers.DeleteUser).Methods("DELETE")
	return router
}
