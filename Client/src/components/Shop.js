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
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";

function Shop({ updateCartCount }) {
  const [products, setProducts] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const cartItem = { product_id: product.id, quantity: 1 };
      const response = await axios.post(
        "http://localhost:8080/api/cart/add",
        cartItem,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleClickImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedImage("");
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Grid container spacing={2}>
        {products && products.length > 0 ? (
          products.map((product) => (
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
                  image={product.imageurl}
                  alt={product.name}
                  sx={{
                    objectFit: "cover",
                    width: "100%",
                    height: "250px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleClickImage(product.imageurl)}
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
          ))
        ) : (
          <Typography variant="h6" align="center" color="text.secondary">
            Không có sản phẩm nào để hiển thị
          </Typography>
        )}
      </Grid>

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

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ position: "relative", textAlign: "center", p: 0 }}>
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={selectedImage}
            alt="Full view"
            style={{ width: "50%", height: "auto" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Shop;
