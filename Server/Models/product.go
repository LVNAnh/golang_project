package Models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Product struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name            string             `bson:"name" json:"name"`
	Price           float64            `bson:"price" json:"price"`
	Stock           int                `bson:"stock" json:"stock"`
	ProductCategory primitive.ObjectID `bson:"productcategory" json:"productcategory"`           // Tham chiếu đến ProductCategory
	ImagePath       string             `bson:"image_path,omitempty" json:"image_path,omitempty"` // Trường lưu đường dẫn hình ảnh
}
