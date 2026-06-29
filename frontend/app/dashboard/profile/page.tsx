"use client";

import { useState, useRef } from "react";
import {
  User, Mail, Phone, Building2, Camera, Save,
  Shield, Eye, EyeOff, CheckCircle,
} from "lucide-react";
import { authApi, ApiClientError, resolveAssetUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Alert from "@/components/ui/Alert";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  staff: "Field Staff",
  client: "Client",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#7c3aed",
  staff: "var(--color-success)",
  client: "var(--color-primary)",
};

// ─── Password field with show/hide ────────────────────────────────────────

function PasswordInput({
  id, label, value, onChange, placeholder, hint,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className="form-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: 44 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 0 }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{hint}</p>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [companyName, setCompanyName] = useState(user?.company_name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!user) return null;

  const initials = user.full_name
    .split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  const avatarSrc = avatarPreview
    ?? (user.profile_picture_url ? resolveAssetUrl(user.profile_picture_url) : null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError("Full name is required");
      return;
    }
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      const fd = new FormData();
      fd.append("full_name", fullName.trim());
      if (phone.trim()) fd.append("phone", phone.trim());
      if (companyName.trim()) fd.append("company_name", companyName.trim());
      if (avatarFile) fd.append("profile_picture", avatarFile);
      await authApi.updateProfile(fd);
      await refreshUser();
      setProfileSuccess(true);
      setAvatarFile(null);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err) {
      setProfileError(err instanceof ApiClientError ? err.message : "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  }

  // NOTE: The Flask backend does not currently expose a change-password
  // endpoint. This section is built ready for when it is added.
  // Expected endpoint: PATCH /api/auth/change-password
  // Body: { current_password, new_password }
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) { setPasswordError("Current password is required"); return; }
    if (!newPassword) { setPasswordError("New password is required"); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }

    setPasswordLoading(true);
    try {
      // Placeholder — wire this up when the backend endpoint is ready
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Change password endpoint not yet available on the backend. Add PATCH /api/auth/change-password to Flask.")), 300)
      );
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Profile settings</h1>
        <p className="page-subtitle">Manage your account information and security.</p>
      </div>

      {/* ── Avatar + identity ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: "28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: ROLE_COLORS[user.role],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 700, color: "#ffffff",
                border: "3px solid var(--color-border)",
                overflow: "hidden",
              }}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={user.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
              style={{
                position: "absolute", bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: "50%",
                background: "var(--color-primary)", border: "2px solid var(--color-surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <Camera size={12} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
              {user.full_name}
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 8 }}>
              {user.email}
            </p>
            <span style={{
              display: "inline-block",
              fontSize: "0.75rem", fontWeight: 700,
              padding: "3px 10px", borderRadius: "var(--radius-full)",
              background: `${ROLE_COLORS[user.role]}1a`,
              color: ROLE_COLORS[user.role],
              textTransform: "capitalize",
            }}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>

          {avatarFile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--color-success)", fontWeight: 600 }}>
                New photo selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile form ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "28px", marginBottom: 20 }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <User size={16} style={{ color: "var(--color-primary)" }} /> Personal information
        </h2>

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Read-only email */}
          <div>
            <label className="form-label">Email address</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                className="form-input"
                value={user.email}
                disabled
                style={{ paddingLeft: 38, background: "var(--color-surface-raised)", cursor: "not-allowed", opacity: 0.7 }}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>
              Email cannot be changed after registration.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="profile-grid">
            {/* Full name */}
            <div>
              <label htmlFor="full_name" className="form-label">
                Full name <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  id="full_name"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setProfileError(""); }}
                  placeholder="Your full name"
                  style={{ paddingLeft: 38 }}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="form-label">Phone number</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  style={{ paddingLeft: 38 }}
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          {/* Company name */}
          <div>
            <label htmlFor="company_name" className="form-label">Company / Organisation</label>
            <div style={{ position: "relative" }}>
              <Building2 size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                id="company_name"
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company or organisation"
                style={{ paddingLeft: 38 }}
                autoComplete="organization"
              />
            </div>
          </div>

          {profileError && <Alert variant="error" message={profileError} onClose={() => setProfileError("")} />}
          {profileSuccess && <Alert variant="success" message="Profile updated successfully." onClose={() => setProfileSuccess(false)} />}

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary"
              style={{ padding: "10px 24px" }}
            >
              {profileLoading ? (
                <><span className="btn-spinner" /> Saving...</>
              ) : (
                <><Save size={15} /> Save changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password section ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: "28px" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={16} style={{ color: "var(--color-primary)" }} /> Change password
        </h2>
        <p style={{ fontSize: "0.8375rem", color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
          Choose a strong password of at least 8 characters. You will remain signed in after changing it.
        </p>

        <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <PasswordInput
            id="current_password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter your current password"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="profile-grid">
            <PasswordInput
              id="new_password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Min. 8 characters"
              hint="At least 8 characters"
            />
            <PasswordInput
              id="confirm_password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat new password"
            />
          </div>

          {passwordError && (
            <Alert variant="error" message={passwordError} onClose={() => setPasswordError("")} />
          )}
          {passwordSuccess && (
            <Alert variant="success" message="Password changed successfully." onClose={() => setPasswordSuccess(false)} />
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-primary"
              style={{ padding: "10px 24px" }}
            >
              {passwordLoading ? (
                <><span className="btn-spinner" /> Updating...</>
              ) : (
                <><Shield size={15} /> Update password</>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .btn-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 4px;
        }
        @media (max-width: 560px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Exported page — RouteGuard accepts any authenticated role ─────────────

export default function ProfilePage() {
  return <ProfileContent />;
}
