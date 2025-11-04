import React, { useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  async function submit() {
    if (!identifier) return;
    setLoading(true);
    try {
      await api.post("/forgot-password", { username_or_email: identifier });
      notify("If the account exists, a reset email was sent", "success");
    } catch (e) {
      notify("Failed to request reset", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Forgot Password</h3>
        <p style={{ color: "#6b7280" }}>Enter your username or email to receive a reset token.</p>
        <input
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={submit} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </div>
      </div>
    </div>
  );
}




