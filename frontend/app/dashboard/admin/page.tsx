"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone, ClipboardList, MapPin, Users,
  Clock, CheckCircle, XCircle, Activity, ArrowRight,
} from "lucide-react";
import { analyticsApi, campaignsApi, ApiClientError } from "@/lib/api";
import type { AnalyticsOverview, Campaign } from "@/types";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recent, setRecent] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [a, c] = await Promise.all([analyticsApi.overview(), campaignsApi.listAll()]);
        setAnalytics(a);
        setRecent(c.slice(0, 6));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load dashboard data");
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

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Loading dashboard data...</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card" style={{ height: 100, background: "var(--color-surface-raised)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p style={{ color: "var(--color-error)", marginTop: 8 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Good {getGreeting()}, {user?.full_name.split(" ")[0]}</h1>
        <p className="page-subtitle">Here&apos;s what&apos;s happening across the platform today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total campaigns" value={analytics?.campaigns.total_campaigns ?? 0} icon={Megaphone} color="var(--color-primary)" colorBg="var(--color-primary-light)" />
        <StatCard label="Pending review" value={analytics?.campaigns.pending_review ?? 0} icon={Clock} color="#b45309" colorBg="#fffbeb" trend="Awaiting your approval" />
        <StatCard label="Active campaigns" value={analytics?.campaigns.active ?? 0} icon={Activity} color="var(--color-success)" colorBg="rgba(16,185,129,0.1)" />
        <StatCard label="Completed" value={analytics?.campaigns.completed ?? 0} icon={CheckCircle} color="#16a34a" colorBg="rgba(22,163,74,0.1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Billboard locations" value={analytics?.locations.total_locations ?? 0} icon={MapPin} color="#0891b2" colorBg="rgba(8,145,178,0.1)" trend={`${analytics?.locations.available_locations ?? 0} available`} />
        <StatCard label="Pending tasks" value={analytics?.tasks.pending_tasks ?? 0} icon={ClipboardList} color="#7c3aed" colorBg="rgba(124,58,237,0.1)" trend={`${analytics?.tasks.completed_tasks ?? 0} completed`} />
        <StatCard label="Total clients" value={analytics?.users.total_clients ?? 0} icon={Users} color="var(--color-primary)" colorBg="var(--color-primary-light)" />
        <StatCard label="Rejected" value={analytics?.campaigns.rejected ?? 0} icon={XCircle} color="var(--color-error)" colorBg="rgba(239,68,68,0.1)" />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Recent campaigns</h2>
          <Link href="/dashboard/admin/campaigns" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            No campaigns submitted yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Client</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>{c.title}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{c.client_name ?? "—"}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{formatDate(c.start_date)} – {formatDate(c.end_date)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{formatDate(c.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}