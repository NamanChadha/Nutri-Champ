import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Plotly from "plotly.js-basic-dist";
import React, { useEffect, useMemo, useRef, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import api from "../api/axios";
import { useToast } from "../components/Toast";

const Plot = createPlotlyComponent(Plotly);

export default function SavedHome() {
  const [plans, setPlans] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const printRef = useRef(null);
  const { notify } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, a] = await Promise.all([
          api.get("/meal-plans"),
          api.get("/food-analyses"),
        ]);
        setPlans(p.data || []);
        setAnalyses(a.data || []);
      } catch (e) {
        notify("Failed to load saved items", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPages = useMemo(() => (plans.length ? Math.max(1, Math.ceil(plans.length / pageSize)) : 1), [plans.length, pageSize]);
  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * pageSize;
    return plans.slice(start, start + pageSize);
  }, [plans, page, pageSize]);

  async function exportHistoryPdf() {
    try {
      const node = printRef.current;
      if (!node) return;
      const canvas = await html2canvas(node, { backgroundColor: "#ffffff", useCORS: true, scale: 2 });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 20;
      if (imgHeight > pageHeight - 40) {
        // split across pages
        let sY = 0;
        const sliceHeight = (canvas.width * (pageHeight - 40)) / imgWidth;
        while (sY < canvas.height) {
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = Math.min(sliceHeight, canvas.height - sY);
          const ctx = slice.getContext("2d");
          ctx.drawImage(canvas, 0, sY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
          const sliceImg = slice.toDataURL("image/png");
          pdf.addImage(sliceImg, "PNG", 20, 20, imgWidth, pageHeight - 40);
          sY += sliceHeight;
          if (sY < canvas.height) pdf.addPage();
        }
      } else {
        pdf.addImage(img, "PNG", 20, y, imgWidth, imgHeight);
      }
      pdf.save("meal_plan_history.pdf");
    } catch (e) {
      console.error(e);
      notify("Failed to export history PDF", "error");
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="card">
          <div className="skeleton" style={{ height: 18, width: 220 }} />
          <div className="skeleton" style={{ height: 12, width: 160, marginTop: 8 }} />
        </div>
        <div className="card">
          <div className="skeleton" style={{ height: 18, width: 220 }} />
          <div className="skeleton" style={{ height: 12, width: 160, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <h2 style={{ marginTop: 0, color: "var(--darkgreen)" }}>Saved</h2>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ marginTop: 0 }}>Saved Meal Plans</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)||6); }} className="btn secondary" style={{ padding: "8px 10px" }}>
              <option value={6}>6 / page</option>
              <option value={9}>9 / page</option>
              <option value={12}>12 / page</option>
            </select>
            {plans.length > 0 && (
              <button className="btn secondary" onClick={exportHistoryPdf}>Export History PDF</button>
            )}
          </div>
        </div>
        {plans.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No meal plans yet.</div>
        ) : (
          <>
            <div ref={printRef} style={{ padding: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <img src="/logo.svg" alt="Nutri Champ" style={{ height: 24, width: 24 }} />
                <div style={{ fontWeight: 700 }}>Meal Plan History</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
                {paginatedPlans.map((p) => {
                  const summary = p?.meal_plan?.nutrition_summary || p?.nutrition_summary || null;
                  return (
                    <div key={p.id || p.created_at} className="stat-card">
                      <div style={{ fontWeight: 700 }}>{p.title || "Meal Plan"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(p.created_at).toLocaleString()}</div>
                      {summary && (
                        <div style={{ marginTop: 8 }}>
                          <Plot
                            data={[{
                              values: [summary.protein_g || 0, summary.carbs_g || 0, summary.fat_g || 0],
                              labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
                              type: "pie",
                              hole: 0.55,
                              hoverinfo: "label+percent+value",
                            }]}
                            layout={{ margin: { t: 10, b: 10, l: 10, r: 10 }, height: 220, showlegend: false }}
                            style={{ width: "100%", height: "100%" }}
                            useResizeHandler
                          />
                        </div>
                      )}
                      <button
                        className="btn secondary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          const text = JSON.stringify(p.meal_plan || p, null, 2);
                          navigator.clipboard.writeText(text);
                          notify("Plan JSON copied", "success");
                        }}
                      >Copy JSON</button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <div style={{ fontSize: 13, color: "var(--muted-text)" }}>Page {page} of {totalPages}</div>
              <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Saved Analyses</h3>
        {analyses.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No analyses yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
            {analyses.map((a) => (
              <div key={a.id} className="stat-card">
                <div style={{ fontWeight: 700 }}>{a.food_name || a.image_filename || "Analysis"}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(a.created_at).toLocaleString()}</div>
                <div style={{ marginTop: 6 }}>
                  Calories: <strong>{a.nutrition_data?.calories ?? "—"}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




