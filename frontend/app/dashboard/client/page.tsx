"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Clock, CheckCircle, XCircle, ArrowRight, Plus } from "lucide-react";
import { campaignsApi, notificationsApi, ApiClientError } from "@/lib/api";
import type { Campaign, Notification } from "@/types";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";

export default function ClientOverviewPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [c, n] = await Promise.all([
          campaignsApi.listMine(),
          notificationsApi.list(),
        ]);
        setCampaigns(c);
        setNotifications(n.filter((n) => !n.is_read).slice(0, 5));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  const stats = {
    total: campaigns.length,
    pending: campaigns.filter((c) => c.status === "submitted").length,
    active: campaigns.filter((c) => c.status === "active" || c.status === "approved").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    rejected: campaigns.filter((c) => c.status === "rejected").length,
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Loading your campaigns...</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: 90, background: "var(--color-surface-raised)" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.full_name.split(" ")[0]}</h1>
          <p className="page-subtitle">Here&apos;s a summary of your OOH campaigns.</p>
        </div>
        <Link href="/dashboard/client/campaigns/new" className="btn-primary">
          <Plus size={16} /> New campaign
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total campaigns" value={stats.total} icon={Megaphone} color="var(--color-primary)" colorBg="var(--color-primary-light)" />
        <StatCard label="Pending review" value={stats.pending} icon={Clock} color="#b45309" colorBg="#fffbeb" trend="Awaiting admin approval" />
        <StatCard label="Active / Approved" value={stats.active} icon={CheckCircle} color="var(--color-success)" colorBg="rgba(16,185,129,0.1)" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="var(--color-error)" colorBg="rgba(239,68,68,0.1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }} className="client-overview-grid">
        {/* Recent campaigns */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Recent campaigns</h2>
            <Link href="/dashboard/client/campaigns" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>You haven&apos;t submitted any campaigns yet.</p>
              <Link href="/dashboard/client/campaigns/new" className="btn-primary" style={{ display: "inline-flex" }}>
                <Plus size={15} /> Submit your first campaign
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>{c.title}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        {formatDate(c.start_date)} – {formatDate(c.end_date)}
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <Link href={`/dashboard/client/campaigns/${c.id}`} style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Unread notifications */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Notifications
              {notifications.length > 0 && (
                <span style={{ marginLeft: 8, background: "var(--color-error)", color: "#fff", fontSize: "0.6875rem", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)" }}>
                  {notifications.length}
                </span>
              )}
            </h2>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              You&apos;re all caught up.
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{n.title}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{n.message}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                    {new Date(n.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .client-overview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}