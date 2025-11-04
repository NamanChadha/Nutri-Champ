// src/App.jsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css"; // global layout styles

// components
import Header from "./components/Header";
import Footer from "./components/Footer";
import RequireAuth from "./components/RequireAuth"; // ✅ route guard
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./components/Theme";

// pages
import Home from "./pages/Home";
import MealPlanPage from "./pages/MealPlanPage";
import AnalyzePage from "./pages/AnalyzePage";
import ProfilePage from "./pages/ProfilePage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SavedHome from "./pages/SavedHome";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <ThemeProvider>
        <ToastProvider>
          <Header />
          <main className="main-content">
            <Suspense fallback={<div className="loading">Loading...</div>}>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/mealplan"
                element={
                  <RequireAuth>
                    <MealPlanPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/analyze"
                element={
                  <RequireAuth>
                    <AnalyzePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
                <Route
                  path="/saved"
                  element={
                    <RequireAuth>
                      <SavedHome />
                    </RequireAuth>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}
