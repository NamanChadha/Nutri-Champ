import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggle: () => {} });

const VARS_LIGHT = {
  "--max-width": "1100px",
  "--beige": "#fffef7",
  "--muted-beige": "#fcfbf7",
  "--darkgreen": "#1f5f4a",
  "--green-accent": "#2f855a",
  "--muted-text": "#6b7280",
  "--card-bg": "#ffffff",
  "--text": "#17202a",
  "--border": "rgba(14,14,14,0.06)",
  "--radius": "14px",
};

const VARS_DARK = {
  "--beige": "#0f172a",
  "--muted-beige": "#0b1220",
  "--darkgreen": "#a7f3d0",
  "--green-accent": "#34d399",
  "--muted-text": "#94a3b8",
  "--card-bg": "#0b1322",
  "--text": "#e5e7eb",
  "--border": "rgba(255,255,255,0.06)",
};

function applyVars(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("nutri_theme") || "light");
  useEffect(() => {
    if (theme === "dark") applyVars(VARS_DARK); else applyVars(VARS_LIGHT);
    localStorage.setItem("nutri_theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);
  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}




