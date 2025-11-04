import React, { useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  async function submit() {
    if (!token || !password || password !== confirm) {
      return notify("Fill all fields; passwords must match", "error");
    }
    setLoading(true);
    try {
      await api.post("/reset-password", { token, new_password: password });
      notify("Password reset successful", "success");
    } catch (e) {
      notify(e?.response?.data?.detail || "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Reset Password</h3>
        <input placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} />
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={submit} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}




