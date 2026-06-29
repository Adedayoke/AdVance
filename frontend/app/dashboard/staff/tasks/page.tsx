"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { tasksApi, ApiClientError } from "@/lib/api";
import type { Task } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Alert from "@/components/ui/Alert";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtered, setFiltered] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
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

  useEffect(() => {
    let list = tasks;
    if (activeTab) list = list.filter((t) => t.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.campaign_title ?? "").toLowerCase().includes(q) ||
          (t.location_name ?? "").toLowerCase().includes(q) ||
          (t.location_address ?? "").toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [tasks, activeTab, search]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">All deployment tasks assigned to you.</p>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-full)",
              border: "1px solid",
              borderColor: activeTab === tab.value ? "var(--color-primary)" : "var(--color-border)",
              background: activeTab === tab.value ? "var(--color-primary)" : "transparent",
              color: activeTab === tab.value ? "#fff" : "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
        <Search
          size={15}
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
        />
        <input
          className="form-input"
          placeholder="Search by campaign or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error" message={error} onClose={() => setError("")} />
        </div>
      )}

      {/* Task cards */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ height: 180, background: "var(--color-surface-raised)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            {search || activeTab ? "No tasks match your filters." : "No tasks have been assigned to you yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                transition: "box-shadow var(--transition-base), transform var(--transition-base)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                (e.currentTarget as HTMLDivElement).style.transform = "";
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.3, flex: 1 }}>
                  {t.campaign_title ?? "Campaign"}
                </h3>
                <StatusBadge status={t.status} />
              </div>

              {/* Location */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  {t.location_name ?? "Location"}
                </p>
                {t.location_address && (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    {t.location_address}
                  </p>
                )}
              </div>

              {/* Dates */}
              {(t.start_date || t.end_date) && (
                <div style={{ display: "flex", gap: 16, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  {t.start_date && <span>Start: <strong style={{ color: "var(--color-text-secondary)" }}>{formatDate(t.start_date)}</strong></span>}
                  {t.end_date && <span>End: <strong style={{ color: "var(--color-text-secondary)" }}>{formatDate(t.end_date)}</strong></span>}
                </div>
              )}

              {/* Instructions preview */}
              {t.instructions && (
                <p style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.5,
                  padding: "8px 10px",
                  background: "var(--color-surface-raised)",
                  borderRadius: "var(--radius-sm)",
                  borderLeft: "3px solid var(--color-primary)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {t.instructions}
                </p>
              )}

              {/* Footer */}
              <div style={{
                paddingTop: 4,
                borderTop: "1px solid var(--color-border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Assigned {formatDate(t.assigned_at)}
                </span>
                <Link
                  href={`/dashboard/staff/tasks/${t.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
                >
                  {t.status === "completed" ? "View" : "Open task"} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}