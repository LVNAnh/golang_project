import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For redirecting to login if user not logged in

function Shop({ updateCartCount }) {
  const [products, setProducts] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate(); // Use navigate for redirection

  // Fetch products from the server
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8080/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };

    fetchProducts();
  }, []);

  // Function to add product to cart
  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login"); // Điều hướng đến trang đăng nhập nếu chưa có token
      return;
    }

    try {
      const cartItem = { product_id: product.id, quantity: 1 };
      const response = await axios.post(
        "http://localhost:8080/cart/add",
        cartItem,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Thêm token vào header
          },
        }
      );

      console.log("Product added to cart:", response.data);
      setSnackbarMessage(
        `Sản phẩm "${product.name}" đã được thêm vào giỏ hàng.`
      );
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error adding to cart", error);
    }
    updateCartCount();
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={3} key={product.id}>
            <Card
              sx={{
                width: "300px",
                height: "450px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <CardMedia
                component="img"
                height="250"
                image={`http://localhost:8080/${product.imageurl}`}
                alt={product.name}
                sx={{ objectFit: "cover", width: "100%", height: "250px" }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.price.toLocaleString()} VND
                </Typography>
              </CardContent>
              <Box sx={{ padding: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleAddToCart(product)}
                  fullWidth
                >
                  Thêm vào giỏ
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Shop;
