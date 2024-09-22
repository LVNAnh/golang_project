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
  Pagination,
  FormControl,
} from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";

const SERVICES_PER_PAGE = 20;

function AddService() {
  const [services, setServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    servicecategory: "",
    image: null,
  });
  const [editServiceId, setEditServiceId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredServices, setFilteredServices] = useState([]);

  const token = localStorage.getItem("token"); // Lấy token từ localStorage

  const fetchServices = async () => {
    try {
      const response = await axios.get("http://localhost:8080/services", {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi kèm token
        },
      });
      setServices(response.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/servicecategories",
        {
          headers: {
            Authorization: `Bearer ${token}`, // Gửi kèm token
          },
        }
      );
      setServiceCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      setServiceCategories([]);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchServiceCategories();
  }, []);

  useEffect(() => {
    handleFilterAndSort();
  }, [services, selectedCategory, sortOrder, currentPage]);

  const handleFilterAndSort = () => {
    let filtered = services;

    if (selectedCategory) {
      filtered = filtered.filter(
        (service) => service.servicecategory === selectedCategory
      );
    }

    if (sortOrder === "asc") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredServices(filtered);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const totalPages = Math.ceil(filteredServices.length / SERVICES_PER_PAGE);

  const displayedServices = filteredServices.slice(
    (currentPage - 1) * SERVICES_PER_PAGE,
    currentPage * SERVICES_PER_PAGE
  );

  const handleAddService = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.description ||
      !formData.servicecategory
    ) {
      setSnackbar({
        open: true,
        message: "Vui lòng điền đầy đủ thông tin dịch vụ.",
        severity: "error",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("servicecategory", formData.servicecategory);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      await axios.post("http://localhost:8080/service", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi kèm token
          "Content-Type": "multipart/form-data",
        },
      });
      setSnackbar({
        open: true,
        message: "Dịch vụ đã được thêm!",
        severity: "success",
      });
      fetchServices();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi thêm dịch vụ.",
        severity: "error",
      });
      console.error(
        "Error adding service:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleUpdateService = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("servicecategory", formData.servicecategory);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      await axios.put(
        `http://localhost:8080/service/${editServiceId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Gửi kèm token
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSnackbar({
        open: true,
        message: "Dịch vụ đã được cập nhật!",
        severity: "success",
      });
      fetchServices();
      setShowDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi cập nhật dịch vụ.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (serviceId) => {
    setDeleteServiceId(serviceId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/service/${deleteServiceId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi kèm token
        },
      });
      setSnackbar({
        open: true,
        message: "Dịch vụ đã được xóa!",
        severity: "success",
      });
      fetchServices();
      setShowConfirmDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi xóa dịch vụ.",
        severity: "error",
      });
    }
  };

  const handleCloseDialog = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      servicecategory: "",
      image: null,
    });
    setEditMode(false);
    setShowDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "price" ? parseFloat(value) : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      price: service.price,
      description: service.description,
      servicecategory: service.servicecategory,
      image: null,
    });
    setEditServiceId(service.id);
    setEditMode(true);
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      handleUpdateService();
    } else {
      handleAddService();
    }
  };

  return (
    <div>
      <h2>Quản lý dịch vụ</h2>

      {/* Thêm button để mở Dialog thêm dịch vụ */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setEditMode(false); // Đặt về chế độ Thêm (không phải Chỉnh sửa)
          setFormData({
            // Đặt lại form về trạng thái ban đầu
            name: "",
            price: "",
            description: "",
            servicecategory: "",
            image: null,
          });
          setShowDialog(true); // Hiển thị Dialog để thêm dịch vụ mới
        }}
        style={{ marginBottom: "20px" }}
      >
        Thêm Dịch Vụ
      </Button>

      <div style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel id="filter-category-label">Lọc theo danh mục</InputLabel>
          <Select
            labelId="filter-category-label"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="">Tất cả danh mục</MenuItem>
            {serviceCategories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl style={{ minWidth: 200 }}>
          <InputLabel id="sort-price-label">Sắp xếp theo giá</InputLabel>
          <Select
            labelId="sort-price-label"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <MenuItem value="asc">Giá cao đến thấp</MenuItem>
            <MenuItem value="desc">Giá thấp đến cao</MenuItem>
          </Select>
        </FormControl>
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên dịch vụ</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Danh mục dịch vụ</TableCell>
              <TableCell>Ảnh dịch vụ</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedServices && displayedServices.length > 0 ? (
              displayedServices.map((service, index) => {
                // Kiểm tra nếu serviceCategories là một mảng hợp lệ
                const category =
                  serviceCategories && serviceCategories.length > 0
                    ? serviceCategories.find(
                        (cat) => cat.id === service.servicecategory
                      )
                    : null;

                return (
                  <TableRow key={service.id}>
                    <TableCell>
                      {(currentPage - 1) * SERVICES_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.price}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>
                      {category ? category.name : "Danh mục không tồn tại"}
                    </TableCell>
                    <TableCell>
                      {service.imageurl ? (
                        <img
                          src={`http://localhost:8080/${service.imageurl}`}
                          alt={service.name}
                          width="50"
                        />
                      ) : (
                        "Không có ảnh"
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(service)}
                      >
                        <FaEdit />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDelete(service.id)}
                      >
                        <FaTrash />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không có dịch vụ nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          showFirstButton
          showLastButton
          style={{
            marginTop: "20px",
            justifyContent: "center",
            display: "flex",
          }}
        />
      )}

      <Dialog open={showDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editMode ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên dịch vụ"
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
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            required
            multiline
          />
          <InputLabel id="servicecategory-label">Danh mục dịch vụ</InputLabel>
          <Select
            labelId="servicecategory-label"
            name="servicecategory"
            value={formData.servicecategory}
            onChange={handleChange}
            fullWidth
          >
            {serviceCategories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>

          <InputLabel style={{ marginTop: "10px" }}>
            Hình ảnh dịch vụ
          </InputLabel>
          <input type="file" accept="image/*" onChange={handleFileChange} />
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

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>Xác nhận</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa dịch vụ này không?
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

export default AddService;
