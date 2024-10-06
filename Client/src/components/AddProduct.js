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

const PRODUCTS_PER_PAGE = 20;

function AddProduct() {
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    productcategory: "",
    image: null,
  });
  const [editProductId, setEditProductId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchProductCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/productcategories"
      );
      setProductCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      setProductCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProductCategories();
  }, []);

  useEffect(() => {
    handleFilterAndSort();
  }, [products, selectedCategory, sortOrder, currentPage]);

  const handleFilterAndSort = () => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.productcategory === selectedCategory
      );
    }

    if (sortOrder === "asc") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(filtered);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const handleAddProduct = async () => {
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

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("productcategory", formData.productcategory);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      await axios.post("http://localhost:8080/api/product", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      });
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

  const handleUpdateProduct = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("productcategory", formData.productcategory);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      await axios.put(
        `http://localhost:8080/api/product/${editProductId}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${getToken()}`,
          },
        }
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

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      productcategory: product.productcategory,
      image: null,
    });
    setEditProductId(product.id);
    setEditMode(true);
    setShowDialog(true);
  };

  const handleDelete = async (productId) => {
    setDeleteProductId(productId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8080/api/product/${deleteProductId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
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

  const handleCloseDialog = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      productcategory: "",
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
      [name]: name === "price" || name === "stock" ? parseFloat(value) : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      handleUpdateProduct();
    } else {
      handleAddProduct();
    }
  };

  return (
    <div>
      <h2>Quản lý sản phẩm</h2>

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setShowDialog(true);
          setEditMode(false);
          setFormData({
            name: "",
            price: "",
            stock: "",
            productcategory: "",
            image: null,
          });
        }}
        style={{ marginBottom: "20px" }}
      >
        Thêm Sản Phẩm
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
            {productCategories.map((category) => (
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
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Kho</TableCell>
              <TableCell>Danh mục sản phẩm</TableCell>
              <TableCell>Ảnh sản phẩm</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedProducts.map((product, index) => {
              const category = productCategories.find(
                (cat) => cat.id === product.productcategory
              );

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {(currentPage - 1) * PRODUCTS_PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    {category ? category.name : "Danh mục không tồn tại"}
                  </TableCell>
                  <TableCell>
                    {product.imageurl ? (
                      <img
                        src={`http://localhost:8080/${product.imageurl}`}
                        alt={product.name}
                        width="50"
                      />
                    ) : (
                      "Không có ảnh"
                    )}
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
            })}
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
            {productCategories && productCategories.length > 0 ? (
              productCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                Không có danh mục
              </MenuItem>
            )}
          </Select>

          <InputLabel style={{ marginTop: "10px" }}>
            Hình ảnh sản phẩm
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
