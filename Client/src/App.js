import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import AddProductCategory from "./components/AddProductCategory";
import AddProduct from "./components/AddProduct";
import AddServiceCategory from "./components/AddServiceCategory";
import AddService from "./components/AddService";
import Shop from "./components/Shop";
import Cart from "./components/Cart";
import ServiceBooking from "./components/ServiceBooking";
import OrderPage from "./components/OrderPage";
import OrderBookingServiceManagement from "./components/OrderBookingServiceManagement";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from "@mui/material";
import { Search, ShoppingCart, Person } from "@mui/icons-material";
import axios from "axios";

function AdminMenu() {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleAdminMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button color="inherit" onClick={handleAdminMenuClick}>
        Admin
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleAdminMenuClose}
      >
        <MenuItem component={Link} to="/add-product-category">
          Quản lý danh mục sản phẩm
        </MenuItem>
        <MenuItem component={Link} to="/add-product">
          Quản lý sản phẩm
        </MenuItem>
        <MenuItem component={Link} to="/add-service-category">
          Quản lý danh mục dịch vụ
        </MenuItem>
        <MenuItem component={Link} to="/add-service">
          Quản lý dịch vụ
        </MenuItem>
        <MenuItem component={Link} to="/order-booking-service-history">Quản lý lịch sử đơn hàng dịch vụ</MenuItem>
      </Menu>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [, setCartItems] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    updateCartCount();
  }, []);

  const updateCartCount = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.get("http://localhost:8080/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cartItems = response.data.items || [];
        setCartItems(cartItems);
        const distinctProductsCount = cartItems.length;
        setCartCount(distinctProductsCount);
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setCartCount(0);
    setCartItems([]);
    window.location.reload();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: "none",
                color: "inherit",
                marginRight: 2,
              }}
            >
              Trang chủ
            </Typography>
            <Button color="inherit" component={Link} to="/about">
              About us
            </Button>

            <Button color="inherit" component={Link} to="/contact">
              Liên hệ
            </Button>

            <Button color="inherit" component={Link} to="/shop">
              Shop
            </Button>

            {user && user.role === 0 && <AdminMenu />}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton color="inherit" sx={{ ml: 3 }}>
              <Search />
            </IconButton>
            <IconButton color="inherit" component={Link} to="/cart">
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {user ? (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/profile"
                  sx={{
                    textDecoration: "none",
                    color: "inherit",
                    marginRight: 2,
                  }}
                >
                  {user.firstname} {user.lastname}
                </Button>
                <Button color="inherit" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <IconButton color="inherit" component={Link} to="/login">
                <Person />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ padding: 2 }}>
        {location.pathname === "/" && <ServiceBooking />}
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/login"
            element={
              <LoginForm setUser={setUser} updateCartCount={updateCartCount} />
            }
          />

          <Route
            path="/shop"
            element={<Shop updateCartCount={updateCartCount} />}
          />
          <Route
            path="/cart"
            element={
              <Cart
                updateCartCount={updateCartCount}
                setCartCount={setCartCount}
              />
            }
          />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/service-booking" element={<ServiceBooking />} />

          {user && user.role === 0 && (
            <>
              <Route
                path="/add-product-category"
                element={<AddProductCategory />}
              />
              <Route path="/add-product" element={<AddProduct />} />
              <Route
                path="/add-service-category"
                element={<AddServiceCategory />}
              />
              <Route path="/add-service" element={<AddService />} />
              <Route
                path="/order-booking-service-history"
                element={<OrderBookingServiceManagement />}
              />
            </>
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
