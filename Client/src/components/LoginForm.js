import React, { useState } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function LoginForm({ setUser, updateCartCount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();

        if (userData.token) {
          localStorage.setItem("token", userData.token);

          const decodedToken = jwtDecode(userData.token);
          const userRole = decodedToken.role;

          localStorage.setItem("userRole", userRole);
          setUser({ ...userData, role: userRole });

          updateCartCount();
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        window.location.href = "/";
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Đăng nhập không thành công");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi");
    }
  };

  return (
    <div className="container">
      <h2>Đăng nhập</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Đăng nhập
        </button>
      </form>

      <div className="mt-3">
        Bạn chưa có tài khoản?{" "}
        <Link to="/register" className="text-primary">
          Đăng ký ngay!
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;
