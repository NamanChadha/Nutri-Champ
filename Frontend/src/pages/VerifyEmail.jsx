import React, { useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  async function requestCode() {
    setLoading(true);
    try {
      await api.post("/request-verification");
      notify("Verification code sent", "success");
    } catch (e) {
      notify(e?.response?.data?.detail || "Failed to send code", "error");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!code) return;
    setLoading(true);
    try {
      await api.post("/verify-email", { code });
      notify("Email verified", "success");
    } catch (e) {
      notify(e?.response?.data?.detail || "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Verify Email</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn secondary" onClick={requestCode} disabled={loading}>
            {loading ? "Sending..." : "Send Code"}
          </button>
          <button className="btn" onClick={submit} disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}




