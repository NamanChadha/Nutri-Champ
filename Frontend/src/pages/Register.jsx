// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: "", color: "#ccc" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/register", {
        username,
        email: email || null,
        password,
      }); // ✅ send JSON

      if (res.status === 201 || res.status === 200) {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  function evaluateStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { label: "Very Weak", color: "#d1d5db" },
      { label: "Weak", color: "#f59e0b" },
      { label: "Fair", color: "#84cc16" },
      { label: "Good", color: "#10b981" },
      { label: "Strong", color: "#059669" },
    ];
    return { score, ...map[score] };
  }

  function onPasswordChange(val) {
    setPassword(val);
    setStrength(evaluateStrength(val));
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join Nutri Champ 🌱 Start your journey</p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleRegister} className="register-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email (optional - for meal plan notifications)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
          {/* Password strength meter */}
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 8, background: "#eee", borderRadius: 6 }}>
              <div
                style={{
                  width: `${(strength.score / 4) * 100}%`,
                  height: 8,
                  background: strength.color,
                  borderRadius: 6,
                  transition: "width 200ms ease",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Strength: {strength.label}
            </div>
          </div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="login-link">
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
