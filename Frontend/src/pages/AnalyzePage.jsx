import React, { useState } from "react";
import api from "../api/axios"; // ✅ axios instance with JWT
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import "./AnalyzePage.css";


const Plot = createPlotlyComponent(Plotly);

export default function AnalyzePage() {
  const [foodText, setFoodText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [error, setError] = useState("");
  const [anim, setAnim] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (foodText) form.append("food", foodText);

      const res = await api.post("/analyze-food/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNutrition(res.data.nutrition_summary || res.data || null);
      const ns = res.data.nutrition_summary || res.data || {};
      animateStats(ns);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function animateStats(ns) {
    const duration = 600;
    const start = performance.now();
    const from = { ...anim };
    const to = {
      calories: Number(ns.calories) || 0,
      protein_g: Number(ns.protein_g) || 0,
      carbs_g: Number(ns.carbs_g) || 0,
      fat_g: Number(ns.fat_g) || 0,
    };
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setAnim({
        calories: Math.round(from.calories + (to.calories - from.calories) * ease),
        protein_g: Math.round(from.protein_g + (to.protein_g - from.protein_g) * ease),
        carbs_g: Math.round(from.carbs_g + (to.carbs_g - from.carbs_g) * ease),
        fat_g: Math.round(from.fat_g + (to.fat_g - from.fat_g) * ease),
      });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <h2 style={{ marginTop: 0, color: "var(--darkgreen)" }}>Food Analysis</h2>

      {/* Input Card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Food name (optional)"
            value={foodText}
            onChange={(e) => setFoodText(e.target.value)}
            style={{
              flex: "1 1 300px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button className="btn" onClick={analyze} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        <div style={{ marginTop: 12, color: "var(--muted-text)" }}>
          Upload a photo or enter a food name and Nutri Champ will return a
          nutrition breakdown.
        </div>
      </div>

      {/* Error Message */}
      {error && <div style={{ color: "crimson", marginTop: 12 }}>{error}</div>}

      {/* Nutrition Results */}
      {nutrition && (
        <div style={{ marginTop: 20 }}>
          <h3 className="section-heading">Nutrition Summary</h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">Calories</div>
              <div className="value">{nutrition ? anim.calories : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="label">Protein (g)</div>
              <div className="value">{nutrition ? anim.protein_g : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="label">Carbs (g)</div>
              <div className="value">{nutrition ? anim.carbs_g : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="label">Fat (g)</div>
              <div className="value">{nutrition ? anim.fat_g : "—"}</div>
            </div>
          </div>

          {/* ✅ Pie Chart */}
          <div className="card chart-box" style={{ marginTop: 20 }}>
            <Plot
              data={[
                {
                  values: [
                    nutrition.protein_g || 0,
                    nutrition.carbs_g || 0,
                    nutrition.fat_g || 0,
                  ],
                  labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
                  type: "pie",
                  hole: 0.5,
                  hoverinfo: "label+percent+value",
                },
              ]}
              layout={{
                margin: { t: 20, b: 20, l: 20, r: 20 },
                height: 320,
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          </div>

          {/* ✅ Micronutrients */}
          {nutrition.micros && (
            <div style={{ marginTop: 20 }} className="card">
              <h4 style={{ marginTop: 0 }}>Micronutrients</h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                  gap: 12,
                }}
              >
                {Object.entries(nutrition.micros).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "#fafaf9",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--muted-text)" }}>
                      {k}
                    </div>
                    <div style={{ fontWeight: 700 }}>{v}</div>
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
