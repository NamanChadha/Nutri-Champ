import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useToast } from "./Toast";

export default function GoogleFitness() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const { notify } = useToast();

  useEffect(() => {
    // Check if already connected
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await api.get("/google-fitness/data");
      if (res.data && !res.data.error) {
        setConnected(true);
        setData(res.data);
      }
    } catch (err) {
      setConnected(false);
    }
  }

  async function connect() {
    setLoading(true);
    try {
      const res = await api.get("/google-fitness/auth-url");
      window.location.href = res.data.auth_url;
    } catch (err) {
      notify("Google Fitness not configured", "error");
      setLoading(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get("/google-fitness/data");
      if (res.data.error) {
        notify(res.data.error, "error");
      } else {
        setData(res.data);
        notify("Fitness data updated", "success");
      }
    } catch (err) {
      notify("Failed to fetch fitness data", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span>🏃</span> Google Fitness Integration
      </h3>
      
      {!connected ? (
        <div>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            Connect your Google Fit account to track steps and calories burned.
          </p>
          <button className="btn" onClick={connect} disabled={loading}>
            {loading ? "Connecting..." : "Connect Google Fitness"}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <button className="btn secondary" onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Refresh Data"}
            </button>
          </div>
          
          {data && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginTop: 16
            }}>
              <div className="stat-card" style={{ textAlign: "center", padding: 16 }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Steps Today</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#059669" }}>
                  {data.steps?.toLocaleString() || 0}
                </div>
              </div>
              <div className="stat-card" style={{ textAlign: "center", padding: 16 }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Calories Burned</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626" }}>
                  {data.calories_burned || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



