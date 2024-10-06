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

function AddServiceCategory() {
  const [serviceCategories, setServiceCategories] = useState([]);
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

  const fetchServiceCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/servicecategories"
      );
      setServiceCategories(response.data);
    } catch (error) {
      console.error("Error fetching service categories:", error);
    }
  };

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCategory = async () => {
    try {
      await axios.post("http://localhost:8080/api/servicecategory", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSnackbar({
        open: true,
        message: "Danh mục dịch vụ đã được thêm!",
        severity: "success",
      });
      fetchServiceCategories();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi thêm danh mục dịch vụ.",
        severity: "error",
      });
    }
  };

  const handleUpdateCategory = async () => {
    try {
      await axios.put(
        `http://localhost:8080/api/servicecategory/${editCategoryId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSnackbar({
        open: true,
        message: "Danh mục dịch vụ đã được cập nhật!",
        severity: "success",
      });
      fetchServiceCategories();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi cập nhật danh mục dịch vụ.",
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
      window.confirm("Bạn có chắc chắn muốn xóa danh mục dịch vụ này không?")
    ) {
      try {
        await axios.delete(
          `http://localhost:8080/api/servicecategory/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSnackbar({
          open: true,
          message: "Danh mục dịch vụ đã được xóa!",
          severity: "success",
        });
        fetchServiceCategories();
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Có lỗi xảy ra khi xóa danh mục dịch vụ.",
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
      <h2>Quản lý danh mục dịch vụ</h2>

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
        Thêm danh mục dịch vụ
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
            {serviceCategories && serviceCategories.length > 0 ? (
              serviceCategories.map((category, index) => (
                <TableRow key={category.id ? category.id : index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{category.name || "Tên không xác định"}</TableCell>
                  <TableCell>
                    {category.description || "Mô tả không có sẵn"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(category)}
                      disabled={!category.id}
                    >
                      <FaEdit />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleDelete(category.id)}
                      disabled={!category.id}
                    >
                      <FaTrash />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Không có danh mục nào để hiển thị
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editMode ? "Cập nhật danh mục dịch vụ" : "Thêm danh mục dịch vụ"}
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
export default AddServiceCategory;
