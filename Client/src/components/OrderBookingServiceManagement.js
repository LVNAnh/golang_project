import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";

function OrderBookingServiceManagement() {
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu khi component được render lần đầu
  useEffect(() => {
    fetchServices(); // Lấy danh sách dịch vụ
    fetchOrderBookings(); // Lấy danh sách order booking
  }, []);

  // Lấy danh sách dịch vụ
  const fetchServices = async () => {
    try {
      const response = await axios.get("http://localhost:8080/services");
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // Lấy danh sách đơn hàng booking
  const fetchOrderBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/orderbookingservices",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order bookings:", error);
      setLoading(false);
    }
  };

  // Tìm tên dịch vụ dựa trên service_id
  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Không xác định";
  };

  // Thay đổi trạng thái của đơn hàng
  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8080/orderbookingservice/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrderBookings(); // Cập nhật danh sách sau khi thay đổi trạng thái
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý đơn hàng booking dịch vụ
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell> {/* Hiển thị STT */}
              <TableCell>Tên dịch vụ</TableCell> {/* Hiển thị tên dịch vụ */}
              <TableCell>Số lượng</TableCell>
              <TableCell>Tổng giá</TableCell>
              <TableCell>Ngày đặt</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow key={order.id}>
                <TableCell>{index + 1}</TableCell> {/* Hiển thị STT */}
                <TableCell>{getServiceName(order.service_id)}</TableCell>{" "}
                {/* Hiển thị tên dịch vụ */}
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{order.total_price}</TableCell>
                <TableCell>
                  {new Date(order.booking_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                  >
                    <MenuItem value="Chờ xác nhận">Chờ xác nhận</MenuItem>
                    <MenuItem value="Đã xác nhận">Đã xác nhận</MenuItem>
                    <MenuItem value="Đang tiến hành">Đang tiến hành</MenuItem>
                    <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                    <MenuItem value="Đã hủy">Đã hủy</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default OrderBookingServiceManagement;
