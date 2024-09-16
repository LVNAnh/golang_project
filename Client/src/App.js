import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import AddProductCategory from "./components/AddProductCategory";
import AddProduct from "./components/AddProduct";
import AddServiceCategory from "./components/AddServiceCategory"; // Import the AddServiceCategory component
import AddService from "./components/AddService";
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
} from "@mui/material";
import { Search, ShoppingCart, Person } from "@mui/icons-material";

// AdminMenu component to handle menu interactions
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
      </Menu>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage when the component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {/* Left side */}
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

              {/* Shop Button */}
              <Button color="inherit">Shop</Button>

              {/* Admin Menu */}
              {user && user.role === 0 && <AdminMenu />}
            </Box>

            {/* Right side */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton color="inherit" sx={{ ml: 3 }}>
                <Search />
              </IconButton>
              <IconButton color="inherit">
                <ShoppingCart />
              </IconButton>

              {user ? (
                <>
                  <Typography
                    component={Link}
                    to="/profile"
                    sx={{
                      textDecoration: "none",
                      color: "inherit",
                      marginRight: 2,
                    }}
                  >
                    {user.firstname} {user.lastname}
                  </Typography>
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

        {/* Main Content */}
        <Box sx={{ padding: 2 }}>
          <Routes>
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm setUser={setUser} />} />
            {user && user.role === 0 ? (
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
                <Route path="/add-service" element={<AddService/>}/>
              </>
            ) : (
              <Route path="*" element={<Navigate to="/" />} />
            )}
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
