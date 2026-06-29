"use client";

import { useEffect, useState } from "react";
import {
  Building2, Mail, Phone, MapPin, Copy, Check,
  Save, Hash, Users, ExternalLink,
} from "lucide-react";
import { companiesApi, ApiClientError } from "@/lib/api";
import Alert from "@/components/ui/Alert";
import type { Company } from "@/types";

export default function AgencySettingsPage() {
  const [company, setCompany]     = useState<Company | null>(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Form state
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");

  // Save state
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    companiesApi.getMe()
      .then((c) => {
        setCompany(c);
        setName(c.name);
        setEmail(c.email);
        setPhone(c.phone ?? "");
        setAddress(c.address ?? "");
      })
      .catch((err) => {
        setFetchError(err instanceof ApiClientError ? err.message : "Failed to load agency profile");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!company) return;
    navigator.clipboard.writeText(company.slug).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setSaveError("Agency name is required"); return; }
    if (!email.trim()) { setSaveError("Email is required"); return; }
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await companiesApi.updateMe({
        name:    name.trim(),
        email:   email.trim(),
        phone:   phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setCompany(res.company);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof ApiClientError ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 700, margin: "0 auto" }}>
        <div className="page-header">
          <h1 className="page-title">Agency settings</h1>
          <p className="page-subtitle">Loading agency profile...</p>
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card" style={{ height: 140, background: "var(--color-surface-raised)" }} />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-header" style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 className="page-title">Agency settings</h1>
        <p style={{ color: "var(--color-error)", marginTop: 8 }}>{fetchError}</p>
      </div>
    );
  }

  const registrationBase = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Agency settings</h1>
        <p className="page-subtitle">Manage your agency profile and share your code with staff and clients.</p>
      </div>

      {/* ── Agency code ────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Hash size={16} style={{ color: "var(--color-primary)" }} /> Agency code
        </h2>
        <p style={{ fontSize: "0.8375rem", color: "var(--color-text-muted)", marginBottom: 18, lineHeight: 1.5 }}>
          Share this code with staff and clients so they can register under your agency.
        </p>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "var(--color-surface-raised)",
          border: "1.5px solid var(--color-primary)",
          borderRadius: "var(--radius-md)",
          padding: "14px 18px",
        }}>
          <code style={{
            flex: 1,
            fontSize: "1.25rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "var(--color-primary)",
            fontFamily: "monospace",
            wordBreak: "break-all",
          }}>
            {company?.slug}
          </code>
          <button
            onClick={handleCopy}
            title="Copy agency code"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: copied ? "rgba(16,185,129,0.1)" : "var(--color-surface)",
              color: copied ? "var(--color-success)" : "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 600,
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* ── Registration links ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} style={{ color: "var(--color-primary)" }} /> Registration links
        </h2>
        <p style={{ fontSize: "0.8375rem", color: "var(--color-text-muted)", marginBottom: 18, lineHeight: 1.5 }}>
          Send these links directly to staff members or clients who need to join your workspace.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              label: "Staff registration",
              href: `${registrationBase}/register/staff`,
              hint: `Staff will be prompted to enter your agency code: ${company?.slug}`,
            },
            {
              label: "Client registration",
              href: `${registrationBase}/register`,
              hint: `Clients will be prompted to enter your agency code: ${company?.slug}`,
            },
          ].map(({ label, href, hint }) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-raised)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", wordBreak: "break-all" }}>{hint}</p>
              </div>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: "0.8125rem", fontWeight: 600,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                Open <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Agency profile form ────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={16} style={{ color: "var(--color-primary)" }} /> Agency profile
        </h2>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Agency name */}
          <div>
            <label htmlFor="agency_name" className="form-label">
              Agency name <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <Building2 size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                id="agency_name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaveError(""); }}
                placeholder="Your agency name"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="agency-grid">
            {/* Email */}
            <div>
              <label htmlFor="agency_email" className="form-label">
                Contact email <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  id="agency_email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSaveError(""); }}
                  placeholder="agency@example.com"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="agency_phone" className="form-label">Phone number</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  id="agency_phone"
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="agency_address" className="form-label">Address</label>
            <div style={{ position: "relative" }}>
              <MapPin size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                id="agency_address"
                type="text"
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Agency Street, Lagos"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {saveError && <Alert variant="error" message={saveError} onClose={() => setSaveError("")} />}
          {saveSuccess && <Alert variant="success" message="Agency profile updated successfully." onClose={() => setSaveSuccess(false)} />}

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: "10px 24px" }}
            >
              {saving ? (
                <><span className="btn-spinner" /> Saving...</>
              ) : (
                <><Save size={15} /> Save changes</>
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
          .agency-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
