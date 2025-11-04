// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/login", {
      username,
      password,
    })


      localStorage.setItem("nutri_token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Nutri Champ</h2>
        <p className="login-subtitle">Fuel your goals ✨ Log in to continue</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")} className="register-link">
              Register
            </span>
          </span>
          <span onClick={() => navigate("/forgot-password")} className="register-link">
            Forgot password?
          </span>
        </p>
      </div>
    </div>
  );
}
