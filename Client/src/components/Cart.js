import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import axios from "axios";

function Cart({ updateCartCount, setCartCount }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const navigate = useNavigate();

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8080/cart", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCartItems(response.data.items || []);
      updateCartCount();

      // Fetch selected items to pre-check the checkboxes
      const selectedResponse = await axios.get(
        "http://localhost:8080/selecteditems",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const selectedProductIds = selectedResponse.data.items.map(
        (item) => item.product_id
      );
      setSelectedItems(selectedProductIds);
    } catch (error) {
      console.error("Error fetching cart/selected items", error);
    }
  }, [updateCartCount]);

  // Load stored selectedItems from localStorage when the page loads
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchCartItems();

      const storedSelectedItems = localStorage.getItem("selectedItems");
      if (storedSelectedItems) {
        setSelectedItems(JSON.parse(storedSelectedItems));
      }
    }
  }, []);

  // Save selectedItems to localStorage whenever it changes
  useEffect(() => {
    setAllSelected(
      selectedItems.length === cartItems.length && cartItems.length > 0
    );
  }, [selectedItems, cartItems]);

  const handleRemoveItem = async () => {
    try {
      const response = await axios.delete("http://localhost:8080/cart/remove", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: { product_id: itemToDelete.product_id },
      });

      if (response.status === 200) {
        const updatedCartItems = cartItems.filter(
          (item) => item.product_id !== itemToDelete.product_id
        );
        setCartItems(updatedCartItems);

        updateCartCount();

        if (updatedCartItems.length === 0) {
          setSelectedItems([]);
          setAllSelected(false);
          setCartCount(0);
        } else {
          updateCartCount();
        }

        setSnackbar({
          open: true,
          message: `Sản phẩm "${itemToDelete.name}" đã được xóa khỏi giỏ hàng`,
          severity: "success",
        });
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("Error removing item from cart", error);
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity < 1) {
      return;
    }
    try {
      // Cập nhật số lượng sản phẩm trong giỏ hàng (Cart)
      const response = await axios.post(
        "http://localhost:8080/cart/update",
        { product_id: productId, quantity },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.status === 200) {
        fetchCartItems(); // Refresh cart items
        setSnackbar({
          open: true,
          message: "Số lượng sản phẩm đã được cập nhật",
          severity: "success",
        });
        updateCartCount();

        // Nếu sản phẩm đã có trong selectedItems, cập nhật số lượng trong selectedItems
        if (selectedItems.includes(productId)) {
          await axios.post(
            "http://localhost:8080/selecteditems/update",
            { product_id: productId, quantity },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        }
      }
    } catch (error) {
      console.error("Error updating quantity", error);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setOpenDialog(true);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]); // Deselect all
      cartItems.forEach(async (item) => {
        await axios.delete("http://localhost:8080/selecteditems/remove", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          data: { product_id: item.product_id },
        });
      });
    } else {
      const allProductIds = cartItems.map((item) => item.product_id);
      setSelectedItems(allProductIds); // Select all
      cartItems.forEach(async (item) => {
        await axios.post(
          "http://localhost:8080/selecteditems/add",
          {
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            imageurl: item.imageurl,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      });
    }
    setAllSelected(!allSelected);
  };

  const handleCheckboxChange = async (productId) => {
    let newSelectedItems;

    if (selectedItems.includes(productId)) {
      // Uncheck - remove from selectedItems
      newSelectedItems = selectedItems.filter((id) => id !== productId);
      try {
        await axios.delete("http://localhost:8080/selecteditems/remove", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          data: { product_id: productId }, // Sử dụng phương thức DELETE với body
        });
      } catch (error) {
        console.error("Error removing selected item", error);
      }
    } else {
      // Check - add to selectedItems
      newSelectedItems = [...selectedItems, productId];
      const selectedProduct = cartItems.find(
        (item) => item.product_id === productId
      );
      try {
        await axios.post(
          "http://localhost:8080/selecteditems/add",
          {
            product_id: productId,
            quantity: selectedProduct.quantity,
            price: selectedProduct.price,
            name: selectedProduct.name, // ensure name and imageurl are added
            imageurl: selectedProduct.imageurl,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } catch (error) {
        console.error("Error adding selected item", error);
      }
    }

    setSelectedItems(newSelectedItems);
  };

  const calculateTotalPrice = () => {
    const totalPrice = cartItems
      .filter((item) => selectedItems.includes(item.product_id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    return totalPrice.toLocaleString();
  };

  const handleProceedToOrder = async () => {
    try {
      const response = await axios.get("http://localhost:8080/selecteditems", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const selectedProducts = response.data.items;
      if (selectedProducts.length > 0) {
        navigate("/order", { state: { selectedProducts } });
      } else {
        setSnackbar({
          open: true,
          message: "Vui lòng chọn ít nhất một sản phẩm để đặt hàng.",
          severity: "warning",
        });
      }
    } catch (error) {
      console.error("Error fetching selected items", error);
    }
  };

  if (!user) {
    return (
      <div>
        <h2>Giỏ hàng</h2>
        <p>
          Vui lòng <Link to="/login">đăng nhập</Link> để xem giỏ hàng của bạn.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Giỏ hàng</h2>
      {cartItems.length > 0 ? (
        <>
          <Table
            sx={{
              borderCollapse: "collapse",
              width: "100%",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "center", border: "1px solid black" }}>
                  <Button onClick={handleSelectAll}>
                    {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </Button>
                </th>
                <th style={{ textAlign: "center", border: "1px solid black" }}>
                  Hình ảnh
                </th>
                <th style={{ textAlign: "center", border: "1px solid black" }}>
                  Tên sản phẩm
                </th>
                <th style={{ textAlign: "center", border: "1px solid black" }}>
                  Số lượng
                </th>
                <th style={{ textAlign: "center", border: "1px solid black" }}>
                  Tổng giá
                </th>
                <th style={{ textAlign: "center", border: "1px solid black" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.product_id}>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.product_id)}
                      onChange={() => handleCheckboxChange(item.product_id)}
                    />
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <img
                      src={`http://localhost:8080/${item.imageurl}`}
                      alt={item.name}
                      style={{ width: "70px", height: "70px" }}
                    />
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {item.name}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        onClick={() =>
                          handleQuantityChange(
                            item.product_id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          let value = e.target.value;

                          if (value.includes("-")) {
                            value = value.replace("-", "");
                          }

                          value = Math.max(1, Math.min(10, Number(value)));

                          handleQuantityChange(item.product_id, value);
                        }}
                        style={{
                          width: "40px",
                          textAlign: "center",
                          margin: "0 10px",
                        }}
                        min="1"
                        max="10"
                      />

                      <Button
                        onClick={() =>
                          handleQuantityChange(
                            item.product_id,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= 10}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    {(item.price * item.quantity).toLocaleString()} VND
                  </td>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    <IconButton
                      onClick={() => handleDeleteClick(item)}
                      style={{ color: "red" }}
                    >
                      <Delete />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Table
            sx={{
              borderCollapse: "collapse",
              width: "100%",
              tableLayout: "fixed",
            }}
          >
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  style={{
                    border: "1px solid black",
                    textAlign: "right",
                    fontSize: "30px",
                  }}
                >
                  Tổng thành tiền
                </td>
                <td
                  colSpan={2}
                  style={{ border: "1px solid black", fontSize: "30px" }}
                >
                  {calculateTotalPrice()} VND
                </td>
              </tr>
            </tfoot>
          </Table>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProceedToOrder}
            disabled={selectedItems.length === 0} // Chỉ cho phép tiếp tục khi có sản phẩm được chọn
            sx={{ marginTop: "20px" }}
          >
            Tiến hành đến trang đặt hàng
          </Button>
        </>
      ) : (
        <p>Giỏ hàng của bạn đang trống.</p>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ open: false, message: "", severity: "success" })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có muốn xóa sản phẩm "{itemToDelete?.name}" khỏi giỏ hàng không?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Không
          </Button>
          <Button onClick={handleRemoveItem} color="primary">
            Có
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Cart;
