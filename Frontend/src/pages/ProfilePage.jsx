// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  const { notify } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/me");
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      }
    }
    fetchProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const payload = {
        age: Number(profile.age) || 0,
        goal: profile.goal || "Maintain",
        email: profile.email || null,
      };
      const res = await api.put("/update-profile", payload);
      setProfile(res.data);
      notify("Profile updated", "success");
    } catch (err) {
      console.error(err);
      notify("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!oldPwd || !newPwd) {
      alert("Please fill all password fields");
      return;
    }
    if (newPwd !== confirmNewPwd) {
      alert("New passwords do not match");
      return;
    }
    setPwdLoading(true);
    try {
      await api.post("/change-password", {
        old_password: oldPwd,
        new_password: newPwd,
      });
      notify("Password changed successfully", "success");
      setOldPwd("");
      setNewPwd("");
      setConfirmNewPwd("");
    } catch (err) {
      console.error(err);
      notify(err?.response?.data?.detail || "Failed to change password", "error");
    } finally {
      setPwdLoading(false);
    }
  }

  if (error) {
    return <div className="profile-error">{error}</div>;
  }

  if (!profile) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <h2 className="profile-title">Your Profile</h2>

      <div className="profile-card">
        <div className="profile-field">
          <label className="profile-label">Username</label>
          <input
            type="text"
            value={profile.username || ""}
            disabled
            className="profile-input disabled"
          />
        </div>

        <div className="profile-field">
          <label className="profile-label">Age</label>
          <input
            type="number"
            value={profile.age || ""}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            className="profile-input"
          />
        </div>

        <div className="profile-field">
          <label className="profile-label">Email</label>
          <input
            type="email"
            value={profile.email || ""}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="profile-input"
            placeholder="your@email.com (for meal plan notifications)"
          />
        </div>

        <div className="profile-field">
          <label className="profile-label">Goal</label>
          <select
            value={profile.goal || "Maintain"}
            onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
            className="profile-input"
          >
            <option>Maintain</option>
            <option>Weight Loss</option>
            <option>Muscle Gain</option>
          </select>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className={`profile-btn ${saving ? "disabled" : ""}`}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {profile.email && (
          <div style={{ marginTop: 10, color: "#6b7280" }}>
            Email status: {profile.email_verified ? "Verified" : "Not verified"}
            {!profile.email_verified && (
              <button
                className="btn secondary"
                style={{ marginLeft: 10 }}
                onClick={async () => {
                  try { await api.post("/request-verification"); notify("Verification code sent", "success"); } catch { notify("Failed to send", "error"); }
                }}
              >Send Code</button>
            )}
          </div>
        )}
      </div>

      <div className="profile-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Change Password</h3>
        <div className="profile-field">
          <label className="profile-label">Old Password</label>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            className="profile-input"
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">New Password</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="profile-input"
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">Confirm New Password</label>
          <input
            type="password"
            value={confirmNewPwd}
            onChange={(e) => setConfirmNewPwd(e.target.value)}
            className="profile-input"
          />
        </div>
        <button
          onClick={changePassword}
          disabled={pwdLoading}
          className={`profile-btn ${pwdLoading ? "disabled" : ""}`}
        >
          {pwdLoading ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
