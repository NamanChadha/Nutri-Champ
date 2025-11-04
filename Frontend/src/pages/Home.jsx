// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem("nutri_token");

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <img src={logo} alt="Nutri Champ Logo" className="hero-logo" />
        <h1 className="hero-title">Nutri Champ</h1>
        <p className="hero-subtitle">
          Personalized meal plans, food analysis, and AI coaching — tailored to
          your goals. Fast, reliable, and designed to fit your lifestyle.
        </p>

        <div className="hero-buttons">
          {!token ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Decorative wave */}
        <div className="hero-wave">
          <svg
            viewBox="0 0 1440 100"
            width="100%"
            height="100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C480,100 960,0 1440,60 L1440,100 L0,100 Z"
              fill="#f9fff4"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="features-title">Why Choose Nutri Champ?</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Results</h3>
            <p>
              Get instant meal plans and food analysis — no waiting, actionable
              insights right away.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered</h3>
            <p>
              Powered by modern AI to produce personalized nutrition guidance
              that feels human.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Interactive Charts</h3>
            <p>
              Visualize macro and micronutrient breakdowns with clean,
              easy-to-read charts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
