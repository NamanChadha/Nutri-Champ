import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const el = document.getElementById("root");
if (!el) throw new Error("Root element not found: make sure index.html has <div id='root'></div>");
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
