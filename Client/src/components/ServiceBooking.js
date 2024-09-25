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
  TextField,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

// Import JSON từ tập tin
import districtsData from "../data/districts.json";

function ServiceBooking() {
  const [services, setServices] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [addressNumber, setAddressNumber] = useState(""); // Số nhà và tên đường
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [note, setNote] = useState("");

  // Lấy dữ liệu từ districts.json
  const districts = districtsData["TP.HCM"];

  // Fetch services from the server
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("http://localhost:8080/services");
        setServices(response.data);
      } catch (error) {
        console.error("Error fetching services", error);
      }
    };

    fetchServices();
  }, []);

  // Khi chọn quận/huyện, đặt lại danh sách phường/xã tương ứng
  const handleDistrictChange = (event) => {
    setSelectedDistrict(event.target.value);
    setSelectedWard(""); // Reset phường khi quận thay đổi
  };

  // Function to handle booking
  const handleBooking = (service) => {
    setSelectedService(service);
    setOpenFormDialog(true);
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Open Dialog to show full image
  const handleClickImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

  // Close Dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedImage("");
  };

  // Close Form Dialog
  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setSelectedService(null);
  };

  // Function to handle form submission
  const handleFormSubmit = async () => {
    if (!selectedService) return;

    // Lấy token từ localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbarMessage("Bạn cần đăng nhập để đặt dịch vụ.");
      setOpenSnackbar(true);
      return;
    }

    // Gửi yêu cầu đặt dịch vụ với Authorization header
    try {
      const bookingData = {
        service_id: selectedService.id,
        contact_name: contactName,
        contact_phone: contactPhone,
        address: `${addressNumber}, ${selectedDistrict}, ${selectedWard}`, // Địa chỉ kết hợp
        note: note,
        quantity: 1, // Assume 1 for now, you can customize this
      };

      const response = await axios.post(
        "http://localhost:8080/orderbookingservice",
        bookingData,
        {
          headers: {
            Authorization: token, // Gửi kèm token trong header
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setSnackbarMessage(`Dịch vụ "${selectedService.name}" đã được đặt.`);
        setOpenSnackbar(true);
        handleCloseFormDialog();
      } else {
        setSnackbarMessage("Đã có lỗi xảy ra khi đặt dịch vụ.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("Error booking service", error);
      setSnackbarMessage("Đã có lỗi xảy ra khi đặt dịch vụ.");
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Grid container spacing={2}>
        {services && services.length > 0 ? (
          services.map((service) => (
            <Grid item xs={12} sm={6} md={3} key={service.id}>
              <Card>
                {/* Thêm hình ảnh dịch vụ */}
                <CardMedia
                  component="img"
                  height="250"
                  image={`http://localhost:8080/${service.imageurl}`}
                  alt={service.name}
                  sx={{
                    objectFit: "cover",
                    width: "100%",
                    height: "250px",
                    cursor: "pointer", // Con trỏ thay đổi khi hover vào ảnh
                  }}
                  onClick={() =>
                    handleClickImage(
                      `http://localhost:8080/${service.imageurl}`
                    )
                  } // Click để mở ảnh lớn
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {service.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.price.toLocaleString()} VND
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBooking(service)}
                    sx={{ mt: 2 }}
                  >
                    Đặt
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="h6" align="center" color="text.secondary">
            Không có dịch vụ nào để hiển thị
          </Typography>
        )}
      </Grid>

      {/* Booking Form Dialog */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog}>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Đặt Dịch Vụ: {selectedService?.name}
          </Typography>
          <TextField
            label="Tên người liên hệ"
            fullWidth
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Số điện thoại người liên hệ"
            fullWidth
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            sx={{ mb: 2 }}
          />
          {/* Nhập số nhà và tên đường */}
          <TextField
            label="Số nhà và tên đường"
            fullWidth
            value={addressNumber}
            onChange={(e) => setAddressNumber(e.target.value)}
            sx={{ mb: 2 }}
          />
          {/* Select quận/huyện */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Chọn quận/huyện</InputLabel>
            <Select value={selectedDistrict} onChange={handleDistrictChange}>
              {districts.map((district) => (
                <MenuItem key={district.district} value={district.district}>
                  {district.district}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Select phường/xã */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Chọn phường/xã</InputLabel>
            <Select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              disabled={!selectedDistrict}
            >
              {districts
                .find((district) => district.district === selectedDistrict)
                ?.wards.map((ward) => (
                  <MenuItem key={ward} value={ward}>
                    {ward}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Ghi chú"
            fullWidth
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mb: 2 }}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} color="secondary">
            Hủy
          </Button>
          <Button
            onClick={handleFormSubmit}
            color="primary"
            variant="contained"
          >
            Đặt
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Dialog for full-screen image */}
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
            style={{ width: "40%", height: "auto" }}
          />
        </DialogContent>
      </Dialog>

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

export default ServiceBooking;
