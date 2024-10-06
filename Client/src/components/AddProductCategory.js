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

  const token = localStorage.getItem("token");

  const fetchProductCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/productcategories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProductCategories(response.data);
    } catch (error) {
      console.error("Error fetching product categories:", error);
    }
  };

  useEffect(() => {
    fetchProductCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCategory = async () => {
    try {
      await axios.post("http://localhost:8080/api/productcategory", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

  const handleUpdateCategory = async () => {
    try {
      await axios.put(
        `http://localhost:8080/api/productcategory/${editCategoryId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      handleUpdateCategory();
    } else {
      handleAddCategory();
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, description: category.description });
    setEditCategoryId(category.id);
    setEditMode(true);
    setShowDialog(true);
  };

  const handleDelete = async (categoryId) => {
    if (
      window.confirm("Bạn có chắc chắn muốn xóa danh mục sản phẩm này không?")
    ) {
      try {
        await axios.delete(
          `http://localhost:8080/api/productcategory/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setEditMode(false);
          setFormData({
            name: "",
            description: "",
          });
          setShowDialog(true);
        }}
      >
        Thêm danh mục sản phẩm
      </Button>

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
            {productCategories && productCategories.length > 0 ? (
              productCategories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(category)}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Không có danh mục sản phẩm nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
