"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle, ArrowRight, Camera } from "lucide-react";
import { tasksApi, ApiClientError } from "@/lib/api";
import type { Task } from "@/types";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";

export default function StaffOverviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await tasksApi.listMine();
        setTasks(data);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const activeTasks = tasks.filter((t) => t.status !== "completed");

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Loading your tasks...</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card" style={{ height: 90, background: "var(--color-surface-raised)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.full_name.split(" ")[0]}</h1>
          <p className="page-subtitle">Here are your active deployment tasks.</p>
        </div>
        <Link href="/dashboard/staff/tasks" className="btn-primary">
          <Camera size={16} /> Upload deployment
        </Link>
      </div>

      {error && (
        <p style={{ color: "var(--color-error)", marginBottom: 20 }}>{error}</p>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total tasks"
          value={stats.total}
          icon={ClipboardList}
          color="var(--color-primary)"
          colorBg="var(--color-primary-light)"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="#b45309"
          colorBg="#fffbeb"
          trend="Not yet started"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={ClipboardList}
          color="#2563eb"
          colorBg="rgba(37,99,235,0.1)"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="var(--color-success)"
          colorBg="rgba(16,185,129,0.1)"
        />
      </div>

      {/* Active tasks */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Active tasks
            {activeTasks.length > 0 && (
              <span style={{ marginLeft: 8, background: "var(--color-primary)", color: "#fff", fontSize: "0.6875rem", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)" }}>
                {activeTasks.length}
              </span>
            )}
          </h2>
          <Link
            href="/dashboard/staff/tasks"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {activeTasks.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <CheckCircle size={36} style={{ color: "var(--color-success)", margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>All caught up!</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              You have no pending or in-progress tasks right now.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Location</th>
                  <th>Campaign dates</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.slice(0, 6).map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>
                      {t.campaign_title ?? "—"}
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                      <div>{t.location_name ?? "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {t.location_address ?? ""}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                      {t.start_date ? formatDate(t.start_date) : "—"} – {t.end_date ? formatDate(t.end_date) : "—"}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(t.assigned_at)}
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/staff/tasks/${t.id}`}
                        style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        Open
                      </Link>
                    </td>
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