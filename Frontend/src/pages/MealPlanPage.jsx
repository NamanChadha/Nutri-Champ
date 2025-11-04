// src/pages/MealPlanPage.jsx
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Plotly from "plotly.js-basic-dist";
import React, { useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import api from "../api/axios";
import { useToast } from "../components/Toast";

const Plot = createPlotlyComponent(Plotly);

export default function MealPlanPage() {
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    height: "",
    weight: "",
    goal: "Maintain",
  });
  const [restrictions, setRestrictions] = useState("");
  const [preferences, setPreferences] = useState("");
  const [mealPlan, setMealPlan] = useState(null);
  const [summary, setSummary] = useState(null);
  const [anim, setAnim] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const { notify } = useToast();

  async function generatePlan() {
  setLoading(true);
  setError("");
  try {
    const payload = {
      name: profile.name || "User",
      age: Number(profile.age) || 30,
      height: Number(profile.height) || 170,
      weight: Number(profile.weight) || 70,
      goal: profile.goal || "Maintain",
      restrictions,
      preferences,
    };
    const res = await api.post("/meal-plan", payload);

    setMealPlan(res.data.meal_plan || null);
    setSummary(res.data.nutrition_summary || null);
    const ns = res.data.nutrition_summary || {};
    animateStats(ns);
    notify("Meal plan generated! Check your email if you have one on file.", "success");
  } catch (err) {
    setError(err?.response?.data?.detail || err.message || "Request failed");
    notify("Failed to generate plan", "error");
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

  async function downloadPdf() {
    if (!mealPlan) return;
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Render a small header with logo via html2canvas to ensure SVG compatibility
      const header = document.createElement("div");
      header.style.width = "600px";
      header.style.padding = "12px 0";
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.gap = "10px";
      header.style.background = "transparent";
      header.innerHTML = `
        <img src="/logo.svg" alt="Nutri Champ" style="height:32px;width:32px;object-fit:contain" />
        <div style="font: 700 18px Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#065f46;">${
          profile.name || "User"
        } - Meal Plan</div>
      `;
      document.body.appendChild(header);
      const headerCanvas = await html2canvas(header, { backgroundColor: null, useCORS: true, scale: 2 });
      document.body.removeChild(header);
      const headerImg = headerCanvas.toDataURL("image/png");
      doc.addImage(headerImg, "PNG", 40, 32, 300, 28);

      let y = 80;

      // Nutrition summary
      if (summary) {
        doc.setFontSize(12);
        doc.setTextColor(6, 95, 70);
        doc.text("Nutrition Summary", 40, y);
        y += 16;
        doc.setTextColor(23, 32, 42);
        const lines = [
          `Calories: ${summary.calories ?? "—"}`,
          `Protein: ${summary.protein_g ?? "—"} g`,
          `Carbs: ${summary.carbs_g ?? "—"} g`,
          `Fat: ${summary.fat_g ?? "—"} g`,
        ];
        lines.forEach((t) => {
          doc.text(t, 50, y);
          y += 16;
        });
        y += 10;
      }

      // Meal plan details
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(12);
      doc.text("Plan", 40, y);
      y += 16;
      doc.setTextColor(23, 32, 42);
      doc.setFontSize(11);

      const addLine = (text) => {
        const maxWidth = 515; // page width 595 - margins
        const wrapped = doc.splitTextToSize(text, maxWidth);
        wrapped.forEach((line) => {
          if (y > 800) {
            doc.addPage();
            y = 40;
          }
          doc.text(line, 50, y);
          y += 14;
        });
      };

      Object.entries(mealPlan).forEach(([day, meals]) => {
        if (y > 780) {
          doc.addPage();
          y = 40;
        }
        const dayTitle = day.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        doc.setTextColor(6, 95, 70);
        doc.setFont(undefined, "bold");
        doc.text(dayTitle, 50, y);
        doc.setFont(undefined, "normal");
        doc.setTextColor(23, 32, 42);
        y += 16;
        Object.entries(meals).forEach(([mealType, mealText]) => {
          addLine(`${mealType.toUpperCase()}: ${mealText}`);
        });
        y += 6;
      });

      doc.save("nutri_champ_meal_plan.pdf");
    } catch (e) {
      console.error(e);
      notify("PDF download failed", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  async function emailPlan() {
    if (!mealPlan) return;
    try {
      notify("Sending email...", "success");
      const payload = {
        meal_plan: mealPlan,
        nutrition_summary: summary,
      };
      if (emailTo && emailTo.trim()) payload.to_email = emailTo.trim();
      await api.post("/send-meal-plan-email", payload);
      notify("Meal plan emailed (if your account has an email)", "success");
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.detail || "Failed to send email", "error");
    }
  }

  function copySummaryToClipboard() {
    const text = summary
      ? `Calories: ${summary.calories}\nProtein: ${summary.protein_g}g\nCarbs: ${summary.carbs_g}g\nFat: ${summary.fat_g}g`
      : "";
    navigator.clipboard.writeText(text);
    notify("Summary copied to clipboard", "success");
  }

  function exportSummaryCsv() {
    if (!summary) return;
    const rows = [
      ["Metric", "Value"],
      ["Calories", summary.calories],
      ["Protein (g)", summary.protein_g],
      ["Carbs (g)", summary.carbs_g],
      ["Fat (g)", summary.fat_g],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nutrition_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderPlan(plan) {
    if (!plan) return null;
    const mealIcons = {
      breakfast: "🌅",
      lunch: "🌞",
      dinner: "🌙",
      snacks: "🍎"
    };

    const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snacks"];

    const dayNames = {
      day_1: "Monday",
      day_2: "Tuesday",
      day_3: "Wednesday",
      day_4: "Thursday",
      day_5: "Friday",
      day_6: "Saturday",
      day_7: "Sunday"
    };

    function renderMealsForDay(meals, day) {
      if (Array.isArray(meals)) {
        return meals.map((m, i) => {
          const labelFromIndex = mealOrder[i] || `Meal ${i + 1}`;
          const [maybeLabel, rest] = String(m).split(":");
          const hasLabel = ["breakfast", "lunch", "dinner", "snacks"].includes(
            maybeLabel?.trim().toLowerCase()
          );
          const mealLabel = hasLabel ? maybeLabel.trim() : labelFromIndex;
          const mealText = hasLabel ? (rest?.trim() || m) : m;
          const iconKey = mealLabel.toLowerCase();
          return (
            <div
              key={`${day}-${i}`}
              style={{
                marginBottom: 14,
                padding: 12,
                background: "#ffffff",
                borderRadius: 10,
                border: "1px solid rgba(16,185,129,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#047857",
                }}
              >
                <span style={{ fontSize: 18 }}>{mealIcons[iconKey] || "🍽️"}</span>
                <span>{mealLabel}</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.6,
                }}
              >
                {mealText}
              </div>
            </div>
          );
        });
      }

      return Object.entries(meals).map(([mealType, mealText]) => (
        <div
          key={mealType}
          style={{
            marginBottom: 14,
            padding: 12,
            background: "#ffffff",
            borderRadius: 10,
            border: "1px solid rgba(16,185,129,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 700,
              color: "#047857",
            }}
          >
            <span style={{ fontSize: 18 }}>{mealIcons[mealType] || "🍽️"}</span>
            <span>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            {mealText}
          </div>
        </div>
      ));
    }

    return (
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
        gap: 20,
        marginTop: 20
      }}>
        {Object.entries(plan).map(([day, meals], idx) => {
          const dayName = dayNames[day] || day.replace("_", " ");
          return (
            <div 
              key={day}
              style={{
                background: "linear-gradient(180deg, #ffffff, #f0fdf4)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                border: "1px solid rgba(16,185,129,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                animation: `fadeIn 0.3s ease ${idx * 0.05}s both`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#065f46",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "2px solid rgba(16,185,129,0.2)"
              }}>
                {dayName}
              </div>
              {renderMealsForDay(meals, day)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <h2 style={{ marginTop: 0, color: "var(--darkgreen)" }}>
        Tailored Meal Planning
      </h2>

      {/* Form */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row">
          <div className="col-4">
            <label className="label">Name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="col-4">
            <label className="label">Age</label>
            <input
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            />
          </div>
          <div className="col-4">
            <label className="label">Height (cm)</label>
            <input
              value={profile.height}
              onChange={(e) => setProfile({ ...profile, height: e.target.value })}
            />
          </div>
          <div className="col-4">
            <label className="label">Weight (kg)</label>
            <input
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
            />
          </div>
          <div className="col-4">
            <label className="label">Goal</label>
            <select
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
            >
              <option>Maintain</option>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <button className="btn" onClick={generatePlan} disabled={loading}>
            {loading ? "Generating..." : "Generate Meal Plan"}
          </button>
          {mealPlan && (
            <button
              className="btn secondary"
              onClick={downloadPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? "Preparing PDF..." : "Download PDF"}
            </button>
          )}
          {mealPlan && (
            <>
              <input
                type="email"
                placeholder="Email to... (optional)"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--card-bg)",
                  color: "var(--text)",
                }}
              />
              <button className="btn secondary" onClick={emailPlan}>
                Email Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Restrictions & Preferences */}
      <div style={{ marginBottom: 12 }}>
        <label className="label">Dietary restrictions</label>
        <textarea
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="label">Preferences (flavors, dislikes)</label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      {/* Meal Plan */}
      {mealPlan && (
        <div style={{ marginTop: 10 }}>
          <h3 className="page-title">Generated Plan</h3>
          {renderPlan(mealPlan)}
        </div>
      )}

      {/* Nutrition Summary */}
      {summary && (
        <div style={{ marginTop: 20 }}>
          <h3 className="section-heading">Nutrition snapshot</h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <button className="btn secondary" onClick={copySummaryToClipboard}>Copy Summary</button>
            <button className="btn secondary" onClick={exportSummaryCsv}>Export CSV</button>
          </div>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-label">Calories</div>
              <div className="stat-value">{summary ? anim.calories : "—"}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Protein (g)</div>
              <div className="stat-value">{summary ? anim.protein_g : "—"}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Carbs (g)</div>
              <div className="stat-value">{summary ? anim.carbs_g : "—"}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Fat (g)</div>
              <div className="stat-value">{summary ? anim.fat_g : "—"}</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Plot
              data={[
                {
                  values: [
                    (summary?.protein_g ?? 0) || 0,
                    (summary?.carbs_g ?? 0) || 0,
                    (summary?.fat_g ?? 0) || 0,
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
        </div>
      )}
    </div>
  );
}
