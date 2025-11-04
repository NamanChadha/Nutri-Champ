// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import "./Header.css";
import { useTheme } from "./Theme";

export default function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("nutri_token");
  const { theme, toggle } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("nutri_token");
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand with Logo */}
        <Link to="/" className="brand">
          <img src={logo} alt="Nutri Champ" className="logo" />
          <span className="brand-name">Nutri Champ</span>
        </Link>

        {/* Navigation */}
        <nav className="nav">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/mealplan" className="nav-link">
                Meal Plan
              </Link>
              <Link to="/analyze" className="nav-link">
                Analyze
              </Link>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
              <Link to="/saved" className="nav-link">
                Saved
              </Link>
              <button onClick={toggle} className="logout-btn" style={{ marginRight: 8 }}>
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
