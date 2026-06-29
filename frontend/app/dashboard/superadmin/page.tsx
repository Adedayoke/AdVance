"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, BarChart3, LayoutDashboard,
  CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { superadminApi, ApiClientError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Company, PlatformStats } from "@/types";

// ─── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div
      className="card"
      style={{ padding: "24px 28px", display: "flex", alignItems: "center", gap: 16 }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-sm)",
          background: accent ? `${accent}18` : "var(--color-primary-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent ?? "var(--color-primary)",
          flexShrink: 0,
        }}
      >
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1, fontFamily: "DM Serif Display, serif" }}>
          {value}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Company row ────────────────────────────────────────────────────────────

function CompanyRow({
  company,
  onToggle,
  toggling,
}: {
  company: Company;
  onToggle: (id: string) => void;
  toggling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
        overflow: "hidden",
        transition: "box-shadow var(--transition-base)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Active badge */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: company.is_active ? "var(--color-success)" : "var(--color-danger)",
            flexShrink: 0,
          }}
        />

        {/* Name + slug */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)", lineHeight: 1.3 }}>
            {company.name}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 2 }}>
            Code: <code style={{ fontFamily: "monospace", background: "var(--color-bg)", padding: "1px 5px", borderRadius: 4 }}>{company.slug}</code>
          </div>
        </div>

        {/* Counts */}
        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            <strong style={{ color: "var(--color-text-primary)" }}>{company.user_count ?? "—"}</strong> users
          </span>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            <strong style={{ color: "var(--color-text-primary)" }}>{company.campaign_count ?? "—"}</strong> campaigns
          </span>
        </div>

        {/* Status badge */}
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: company.is_active ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            color: company.is_active ? "var(--color-success)" : "var(--color-danger)",
            flexShrink: 0,
          }}
        >
          {company.is_active ? "Active" : "Suspended"}
        </span>

        {/* Expand toggle */}
        <div style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "16px 20px",
            background: "var(--color-bg)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
            <Detail label="Email" value={company.email} />
            {company.phone && <Detail label="Phone" value={company.phone} />}
            {company.address && <Detail label="Address" value={company.address} />}
            <Detail label="Registered" value={new Date(company.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} />
          </div>
          <button
            onClick={() => onToggle(company.id)}
            disabled={toggling}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: toggling ? "not-allowed" : "pointer",
              background: company.is_active ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
              color: company.is_active ? "var(--color-danger)" : "var(--color-success)",
              fontWeight: 600,
              fontSize: "0.8125rem",
              opacity: toggling ? 0.6 : 1,
              transition: "opacity var(--transition-fast)",
            }}
          >
            {company.is_active ? (
              <><XCircle size={14} /> Suspend agency</>
            ) : (
              <><CheckCircle size={14} /> Reactivate agency</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)" }}>{label}</div>
      <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SuperadminDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats]           = useState<PlatformStats | null>(null);
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError]           = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter]         = useState<"all" | "active" | "suspended">("all");

  // Redirect if not superadmin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "superadmin")) {
      router.replace(user ? `/dashboard/${user.role}` : "/login");
    }
  }, [user, isLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const [s, c] = await Promise.all([superadminApi.stats(), superadminApi.listCompanies()]);
      setStats(s);
      setCompanies(c);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user?.role === "superadmin") loadData();
  }, [isLoading, user, loadData]);

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const { company: updated } = await superadminApi.toggleCompanyActive(id);
      setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (stats) {
        const wasActive = companies.find((c) => c.id === id)?.is_active;
        setStats({
          ...stats,
          active_companies: stats.active_companies + (wasActive ? -1 : 1),
        });
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = companies.filter((c) => {
    if (filter === "active")    return c.is_active;
    if (filter === "suspended") return !c.is_active;
    return true;
  });

  if (isLoading || (!user && !isLoading)) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: "var(--color-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.875rem", fontFamily: "DM Serif Display, serif" }}>A</span>
          </div>
          <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>AdVance</span>
          <span
            style={{
              marginLeft: 6,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "rgba(124,58,237,0.12)",
              color: "#7c3aed",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Platform Admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{user?.full_name}</span>
          <button
            onClick={logout}
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", padding: "36px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <LayoutDashboard size={18} style={{ color: "var(--color-primary)" }} />
            <h1
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "1.75rem",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Platform Overview
            </h1>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            Manage all registered agencies and monitor platform activity.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-danger)",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Stats grid */}
        {loadingData && !stats ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: 32 }}>Loading platform data…</div>
        ) : stats ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 36,
            }}
          >
            <StatCard icon={Building2}   label="Registered agencies" value={stats.total_companies}  accent="var(--color-primary)" />
            <StatCard icon={CheckCircle} label="Active agencies"      value={stats.active_companies} accent="var(--color-success)" />
            <StatCard icon={Users}       label="Total users"          value={stats.total_users}      accent="#7c3aed" />
            <StatCard icon={BarChart3}   label="Total campaigns"      value={stats.total_campaigns}  accent="var(--color-accent)" />
          </div>
        ) : null}

        {/* Companies table */}
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px",
              borderBottom: "1px solid var(--color-border)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Agencies ({filtered.length})
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Filter pills */}
              {(["all", "active", "suspended"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    borderColor: filter === f ? "var(--color-primary)" : "var(--color-border)",
                    background: filter === f ? "var(--color-primary-light)" : "transparent",
                    color: filter === f ? "var(--color-primary)" : "var(--color-text-secondary)",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={loadData}
                disabled={loadingData}
                title="Refresh"
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 8px",
                  cursor: loadingData ? "not-allowed" : "pointer",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  opacity: loadingData ? 0.5 : 1,
                }}
              >
                <RefreshCw size={14} style={{ animation: loadingData ? "spin 0.8s linear infinite" : "none" }} />
              </button>
            </div>
          </div>

          {/* Company list */}
          <div style={{ padding: "12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {loadingData && companies.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                Loading agencies…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                {filter === "all" ? "No agencies registered yet." : `No ${filter} agencies.`}
              </div>
            ) : (
              filtered.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  onToggle={handleToggle}
                  toggling={togglingId === company.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Hint */}
        <p style={{ marginTop: 16, fontSize: "0.8125rem", color: "var(--color-text-muted)", textAlign: "center" }}>
          Agencies self-register at <code style={{ fontFamily: "monospace" }}>/register/company</code>. Suspending an agency prevents all their users from logging in.
        </p>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
