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
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";

function ServiceBooking() {
  const [services, setServices] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

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

  // Function to handle booking
  const handleBooking = (service) => {
    setSnackbarMessage(`Dịch vụ "${service.name}" đã được đặt.`);
    setOpenSnackbar(true);
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
