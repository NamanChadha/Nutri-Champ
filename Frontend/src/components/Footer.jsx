// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-copy">
          © {new Date().getFullYear()} Nutri Champ
        </div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/mealplan">Meal Plan</Link>
          <Link to="/analyze">Analyze</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </div>
    </footer>
  );
}
