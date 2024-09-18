import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Sử dụng useLocation để nhận dữ liệu từ trang Cart
import {
  Table,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";

function OrderPage() {
  const location = useLocation(); // Nhận dữ liệu từ Cart thông qua navigate
  const navigate = useNavigate(); // Điều hướng sau khi đặt hàng thành công
  const [openDialog, setOpenDialog] = useState(false); // Dialog để xác nhận đặt hàng
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const selectedProducts = location.state?.selectedProducts || [];

  const calculateTotalPrice = () => {
    const totalPrice = selectedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return totalPrice.toLocaleString();
  };

  const handleOrderConfirmation = async () => {
    setOpenDialog(true); // Mở dialog xác nhận
  };

  const handlePlaceOrder = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/order",
        { items: selectedProducts }, // Chỉ gửi các sản phẩm đã chọn
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: "Đơn hàng đã được đặt thành công!",
          severity: "success",
        });
        setOpenDialog(false);
        navigate("/shop"); // Điều hướng về trang chủ sau khi đặt hàng thành công
        window.location.reload();
      }
    } catch (error) {
      console.error("Error placing order", error);
      setSnackbar({
        open: true,
        message: "Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.",
        severity: "error",
      });
      setOpenDialog(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Xác nhận đơn hàng</h2>

      {selectedProducts.length > 0 ? (
        <>
          <Table
            sx={{
              borderCollapse: "collapse",
              width: "80%",
              margin: "0 auto", // Center the table
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr>
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
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((item) => (
                <tr key={item.product_id}>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    <img
                      src={`http://localhost:8080/${item.imageurl}`}
                      alt={item.name}
                      style={{ width: "70px", height: "70px" }}
                    />
                  </td>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    {item.name}
                  </td>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{ textAlign: "center", border: "1px solid black" }}
                  >
                    {(item.price * item.quantity).toLocaleString()} VND
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h3>Tổng cộng: {calculateTotalPrice()} VND</h3>

          <Button
            variant="contained"
            color="primary"
            onClick={handleOrderConfirmation}
            sx={{ marginTop: "20px" }}
          >
            Đặt hàng
          </Button>
        </>
      ) : (
        <p>Không có sản phẩm nào được chọn.</p>
      )}

      {/* Dialog xác nhận đặt hàng */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Xác nhận đặt hàng</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn đặt hàng không?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Không
          </Button>
          <Button onClick={handlePlaceOrder} color="primary">
            Có
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ open: false, message: "", severity: "success" })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}

export default OrderPage;
