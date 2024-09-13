import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";

function AddProduct() {
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]); // Khởi tạo mảng rỗng mặc định
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    productcategory: "",
  });
  const [editProductId, setEditProductId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);

  // Fetch products from the server
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8080/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch product categories from the server
  const fetchProductCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/productcategories"
      );
      setProductCategories(response.data || []); // Đảm bảo không phải là null
    } catch (error) {
      console.error("Error fetching product categories:", error);
      setProductCategories([]); // Nếu lỗi, vẫn đảm bảo rằng productCategories là mảng rỗng
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProductCategories();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "price" || name === "stock" ? parseFloat(value) : value,
    });
  };
  

  // Add new product
  const handleAddProduct = async () => {
    // Kiểm tra dữ liệu trước khi gửi
    if (
      !formData.name ||
      !formData.price ||
      !formData.stock ||
      !formData.productcategory
    ) {
      setSnackbar({
        open: true,
        message: "Vui lòng điền đầy đủ thông tin sản phẩm.",
        severity: "error",
      });
      return;
    }

    try {
      // Gửi dữ liệu đến server
      const response = await axios.post(
        "http://localhost:8080/product",
        formData
      );
      setSnackbar({
        open: true,
        message: "Sản phẩm đã được thêm!",
        severity: "success",
      });
      fetchProducts();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi thêm sản phẩm.",
        severity: "error",
      });
      console.error(
        "Error adding product:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // Update existing product
  const handleUpdateProduct = async () => {
    try {
      await axios.put(
        `http://localhost:8080/product/${editProductId}`,
        formData
      );
      setSnackbar({
        open: true,
        message: "Sản phẩm đã được cập nhật!",
        severity: "success",
      });
      fetchProducts();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi cập nhật sản phẩm.",
        severity: "error",
      });
    }
  };

  // Handle submit based on mode (Add or Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      handleUpdateProduct();
    } else {
      handleAddProduct();
    }
  };

  // Handle edit action
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      productcategory: product.productcategory,
    });
    setEditProductId(product.id);
    setEditMode(true);
    setShowDialog(true);
  };

  // Handle delete action
  const handleDelete = async (productId) => {
    setDeleteProductId(productId);
    setShowConfirmDialog(true); // Hiển thị hộp thoại xác nhận
  };

  // Confirm deletion
  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/product/${deleteProductId}`);
      setSnackbar({
        open: true,
        message: "Sản phẩm đã được xóa!",
        severity: "success",
      });
      fetchProducts();
      setShowConfirmDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi xóa sản phẩm.",
        severity: "error",
      });
    }
  };

  // Reset form and close modal
  const handleCloseDialog = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      productcategory: "",
    });
    setEditMode(false);
    setShowDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
  };

  return (
    <div>
      <h2>Quản lý sản phẩm</h2>

      {/* Button to open modal for adding a new product */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setShowDialog(true)}
      >
        Thêm sản phẩm
      </Button>

      {/* Products table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Danh mục sản phẩm</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product, index) => {
                // Tìm danh mục sản phẩm tương ứng với product.productcategory
                const category = productCategories.find(
                  (cat) => cat.id === product.productcategory
                );

                return (
                  <TableRow key={product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      {category ? category.name : "Danh mục không tồn tại"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(product)}
                      >
                        <FaEdit />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDelete(product.id)}
                      >
                        <FaTrash />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for adding/updating a product */}
      <Dialog open={showDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editMode ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên sản phẩm"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Giá"
            name="price"
            value={formData.price}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Số lượng"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            fullWidth
            required
          />
          <InputLabel id="productcategory-label">Danh mục sản phẩm</InputLabel>
          <Select
            labelId="productcategory-label"
            name="productcategory"
            value={formData.productcategory}
            onChange={handleChange}
            fullWidth
          >
            {Array.isArray(productCategories) &&
            productCategories.length > 0 ? (
              productCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>Không có danh mục nào</MenuItem>
            )}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Hủy bỏ
          </Button>
          <Button onClick={handleSubmit} color="primary">
            {editMode ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>Xác nhận</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa sản phẩm này không?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="secondary">
            Hủy bỏ
          </Button>
          <Button onClick={confirmDelete} color="primary">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default AddProduct;
