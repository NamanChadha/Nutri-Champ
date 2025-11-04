// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import "./Dashboard.css";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [foodText, setFoodText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("analyze_history") || "[]");
    } catch {
      return [];
    }
  });
  const { notify } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/me");
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  async function quickAnalyze() {
    setLoading(true);
    try {
      const form = new FormData();
      if (foodText) form.append("food", foodText);
      if (file) form.append("file", file);
      const res = await api.post("/analyze-food/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = res.data.nutrition_summary || res.data || null;
      const entry = {
        ts: Date.now(),
        input: foodText || (file ? file.name : "(no input)"),
        result,
      };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("analyze_history", JSON.stringify(updated));
      setFoodText("");
      setFile(null);
      notify("Analysis complete", "success");
    } catch (err) {
      console.error(err);
      notify(err?.response?.data?.detail || "Quick analyze failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-container">
      {profile && (
        <div>
          <div className="hero-card" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Welcome back, {profile.username} 👋</h2>
            <div style={{ color: "var(--muted-text)", marginTop: 6 }}>
              Goal: <strong>{profile.goal}</strong> • Age: {profile.age}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/mealplan" className="dash-btn">🍽 Create Meal Plan</a>
              <a href="/analyze" className="dash-btn">🔍 Analyze Food</a>
              <a href="/saved" className="dash-btn">💾 Saved</a>
              <a href="/profile" className="dash-btn">👤 Profile</a>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Quick Analyze</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                placeholder="Food name (e.g., Grilled chicken salad)"
                value={foodText}
                onChange={(e) => setFoodText(e.target.value)}
                style={{ flex: "1 1 280px" }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button className="btn" onClick={quickAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-text)", marginTop: 6 }}>
              Add a name or an image (or both) and we’ll estimate macros.
            </div>
          </div>

          {history?.length > 0 && (
            <div className="card" style={{ marginTop: 16, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Recent Results</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                {history.map((h) => (
                  <div key={h.ts} className="stat-card">
                    <div style={{ fontSize: 12, color: "var(--muted-text)" }}>{new Date(h.ts).toLocaleString()}</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{h.input}</div>
                    {h.result && (
                      <div style={{ marginTop: 8, fontSize: 14 }}>
                        <div>Calories: <strong>{h.result.calories ?? "—"}</strong></div>
                        <div>Protein: <strong>{h.result.protein_g ?? "—"}g</strong></div>
                        <div>Carbs: <strong>{h.result.carbs_g ?? "—"}g</strong></div>
                        <div>Fat: <strong>{h.result.fat_g ?? "—"}g</strong></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
