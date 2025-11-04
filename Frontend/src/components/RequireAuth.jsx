import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import api from "../api/axios"
import "./RequireAuth.css"

export default function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem("nutri_token")
      if (!token) {
        setIsAuthenticated(false)
        setChecking(false)
        return
      }

      try {
        await api.get("/me")
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem("nutri_token")
        setIsAuthenticated(false)
      } finally {
        setChecking(false)
      }
    }

    verifyToken()
  }, [])

  if (checking) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
