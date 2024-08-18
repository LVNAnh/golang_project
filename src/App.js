import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      <div className="container">
        <header className="d-flex justify-content-between py-3">
          <nav>
            {!user && (
              <>
                <Link className="btn btn-link" to="/register">
                  Đăng ký
                </Link>
                <Link className="btn btn-link" to="/login">
                  Đăng nhập
                </Link>
              </>
            )}
          </nav>
          {user && (
            <div>
              <span>Hello, {user.firstname}</span>
              <button className="btn btn-link" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </header>
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm setUser={setUser} />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
