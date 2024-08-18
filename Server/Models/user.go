package Models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Role int

const (
	Admin Role = iota
	Staff
	Customer
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	FirstName string             `json:"firstname,omitempty"`
	LastName  string             `json:"lastname,omitempty"`
	Email     string             `json:"email,omitempty"`
	Password  string             `json:"password,omitempty"`
	Phone     string             `json:"phone,omitempty"`
	Address   string             `json:"address,omitempty"`
	Role      Role               `json:"role,omitempty"`
	Avatar    string             `json:"avatar,omitempty"`
}
