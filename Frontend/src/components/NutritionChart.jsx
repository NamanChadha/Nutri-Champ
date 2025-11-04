import React from "react";
import Plot from "react-plotly.js";

export default function NutritionChart({ summary }) {
  const calories = summary?.calories || 0;
  const protein = summary?.protein_g || 0;
  const carbs = summary?.carbs_g || 0;
  const fat = summary?.fat_g || 0;

  const data = [
    {
      values: [protein, carbs, fat],
      labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
      type: "pie",
      hole: 0.5,
      hoverinfo: "label+percent+value",
    },
  ];

  const layout = {
    margin: { t: 10, b: 10, l: 10, r: 10 },
    height: 320,
    showlegend: true,
  };

  return (
    <div className="chart-card">
      <Plot data={data} layout={layout} useResizeHandler style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
