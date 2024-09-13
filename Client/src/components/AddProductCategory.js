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
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";

function AddProductCategory() {
  const [productCategories, setProductCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch product categories from the server
  const fetchProductCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/productcategories"
      );
      setProductCategories(response.data);
    } catch (error) {
      console.error("Error fetching product categories:", error);
    }
  };

  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/productcategories"
        );
        console.log(response.data); // Log dữ liệu trả về để kiểm tra
        setProductCategories(response.data);
      } catch (error) {
        console.error("Error fetching product categories:", error);
      }
    };

    fetchProductCategories();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add new product category
  const handleAddCategory = async () => {
    try {
      await axios.post("http://localhost:8080/productcategory", formData);
      setSnackbar({
        open: true,
        message: "Danh mục sản phẩm đã được thêm!",
        severity: "success",
      });
      fetchProductCategories();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi thêm danh mục sản phẩm.",
        severity: "error",
      });
    }
  };

  // Update existing product category
  const handleUpdateCategory = async () => {
    console.log("Updating category with ID:", editCategoryId); // Kiểm tra giá trị ID trước khi gửi
    try {
      await axios.put(
        `http://localhost:8080/productcategory/${editCategoryId}`,
        formData
      );
      setSnackbar({
        open: true,
        message: "Danh mục sản phẩm đã được cập nhật!",
        severity: "success",
      });
      fetchProductCategories();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi cập nhật danh mục sản phẩm.",
        severity: "error",
      });
    }
  };

  // Handle submit based on mode (Add or Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      console.log("Updating category with ID:", editCategoryId); // Log lại ID để kiểm tra
      handleUpdateCategory();
    } else {
      handleAddCategory();
    }
  };

  // Handle edit action
  const handleEdit = (category) => {
    console.log("Selected category for editing:", category); // Kiểm tra đối tượng category
    console.log("Edit Category ID:", category.id); // Log ra ID để kiểm tra

    setFormData({ name: category.name, description: category.description });
    setEditCategoryId(category.id); // Lưu ID vào state sử dụng đúng trường `id`
    setEditMode(true);
    setShowDialog(true);
  };

  const handleDelete = async (categoryId) => {
    console.log("Deleting category with ID:", categoryId); // Log ra ID để kiểm tra
    if (
      window.confirm("Bạn có chắc chắn muốn xóa danh mục sản phẩm này không?")
    ) {
      try {
        await axios.delete(
          `http://localhost:8080/productcategory/${categoryId}`
        );
        setSnackbar({
          open: true,
          message: "Danh mục sản phẩm đã được xóa!",
          severity: "success",
        });
        fetchProductCategories();
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Có lỗi xảy ra khi xóa danh mục sản phẩm.",
          severity: "error",
        });
      }
    }
  };

  // Reset form and close modal
  const handleCloseDialog = () => {
    setFormData({ name: "", description: "" });
    setEditMode(false);
    setShowDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
  };

  return (
    <div>
      <h2>Quản lý danh mục sản phẩm</h2>

      {/* Button to open modal for adding a new category */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setShowDialog(true)}
      >
        Thêm danh mục sản phẩm
      </Button>

      {/* Product categories table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên danh mục</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productCategories.map((category, index) => (
              <TableRow key={category._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  {/* Sử dụng hàm console.log để kiểm tra khi nhấn vào edit */}
                  <IconButton
                    color="primary"
                    onClick={() => {
                      console.log("Selected category for editing:", category); // Log toàn bộ đối tượng category
                      handleEdit(category);
                    }}
                  >
                    <FaEdit />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleDelete(category.id)}
                  >
                    <FaTrash />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for adding/updating a product category */}
      <Dialog open={showDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editMode ? "Cập nhật danh mục sản phẩm" : "Thêm danh mục sản phẩm"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên danh mục"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            required
          />
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

export default AddProductCategory;
