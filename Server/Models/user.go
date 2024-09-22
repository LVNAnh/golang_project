package Models

import (
	"time"

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
	Cart      Cart               `json:"cart,omitempty"` // Thêm giỏ hàng vào User
}

type Cart struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id,omitempty" json:"user_id,omitempty"` // Liên kết với User
	Items     []CartItem         `bson:"items,omitempty" json:"items,omitempty"`     // Danh sách các sản phẩm trong giỏ hàng
	CreatedAt time.Time          `bson:"created_at,omitempty" json:"created_at,omitempty"`
	UpdatedAt time.Time          `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
}

type CartItem struct {
	ProductID primitive.ObjectID `bson:"product_id,omitempty" json:"product_id,omitempty"` // Liên kết với sản phẩm
	Quantity  int                `bson:"quantity,omitempty" json:"quantity,omitempty"`     // Số lượng sản phẩm trong giỏ hàng
	Price     float64            `bson:"price,omitempty" json:"price,omitempty"`           // Giá tại thời điểm thêm sản phẩm vào giỏ
	Name      string             `bson:"-" json:"name,omitempty"`                          // Tên sản phẩm (không lưu trong MongoDB, chỉ dùng để hiển thị)
	ImageURL  string             `bson:"-" json:"imageurl,omitempty"`                      // URL ảnh sản phẩm (không lưu trong MongoDB)
}

// Struct cho SelectedItems (Danh sách các sản phẩm đã được chọn)
type SelectedItems struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id,omitempty" json:"user_id,omitempty"` // Liên kết với User
	Items     []SelectedItem     `bson:"items,omitempty" json:"items,omitempty"`     // Danh sách các sản phẩm đã chọn
	CreatedAt time.Time          `bson:"created_at,omitempty" json:"created_at,omitempty"`
	UpdatedAt time.Time          `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
}

// Struct cho từng sản phẩm đã được chọn trong SelectedItems
type SelectedItem struct {
	ProductID primitive.ObjectID `bson:"product_id,omitempty" json:"product_id,omitempty"`
	Quantity  int                `bson:"quantity,omitempty" json:"quantity,omitempty"`
	Price     float64            `bson:"price,omitempty" json:"price,omitempty"`       // Giá tại thời điểm chọn
	Name      string             `bson:"name,omitempty" json:"name,omitempty"`         // Tên sản phẩm, được lưu trữ trong MongoDB
	ImageURL  string             `bson:"imageurl,omitempty" json:"imageurl,omitempty"` // URL ảnh sản phẩm, được lưu trữ trong MongoDB
}

// Struct cho Order
type Order struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID     primitive.ObjectID `bson:"user_id,omitempty" json:"user_id,omitempty"`
	Items      []OrderItem        `bson:"items,omitempty" json:"items,omitempty"` // Danh sách các OrderItem
	TotalPrice float64            `bson:"total_price,omitempty" json:"total_price,omitempty"`
	CreatedAt  time.Time          `bson:"created_at,omitempty" json:"created_at,omitempty"`
	UpdatedAt  time.Time          `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
}

// Struct cho OrderItem
type OrderItem struct {
	ProductID primitive.ObjectID `bson:"product_id,omitempty" json:"product_id,omitempty"`
	Quantity  int                `bson:"quantity,omitempty" json:"quantity,omitempty"`
	Price     float64            `bson:"price,omitempty" json:"price,omitempty"`       // Giá tại thời điểm mua
	Name      string             `bson:"name,omitempty" json:"name,omitempty"`         // Tên sản phẩm (không lưu trong MongoDB)
	ImageURL  string             `bson:"imageurl,omitempty" json:"imageurl,omitempty"` // URL ảnh sản phẩm (không lưu trong MongoDB)
}
