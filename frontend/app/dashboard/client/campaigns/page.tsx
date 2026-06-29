"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ArrowRight } from "lucide-react";
import { campaignsApi, ApiClientError, resolveAssetUrl } from "@/lib/api";
import type { Campaign } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Alert from "@/components/ui/Alert";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

export default function ClientCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await campaignsApi.listMine();
        setCampaigns(data);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let list = campaigns;
    if (activeTab) list = list.filter((c) => c.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [campaigns, activeTab, search]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">My Campaigns</h1>
          <p className="page-subtitle">All your submitted OOH advertising campaigns.</p>
        </div>
        <Link href="/dashboard/client/campaigns/new" className="btn-primary">
          <Plus size={16} /> New campaign
        </Link>
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
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input className="form-input" placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert variant="error" message={error} onClose={() => setError("")} /></div>}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="card" style={{ height: 160, background: "var(--color-surface-raised)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
            {search || activeTab ? "No campaigns match your filters." : "You haven't submitted any campaigns yet."}
          </p>
          {!search && !activeTab && (
            <Link href="/dashboard/client/campaigns/new" className="btn-primary" style={{ display: "inline-flex" }}>
              <Plus size={15} /> Submit your first campaign
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((c) => (
            <div
              key={c.id}
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
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                  {c.creative_url && (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveAssetUrl(c.creative_url)}
                        alt={`${c.title} creative`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.3, flex: 1, minWidth: 0 }}>{c.title}</h3>
                </div>
                <StatusBadge status={c.status} />
              </div>

              {c.description && (
                <p style={{ fontSize: "0.8375rem", color: "var(--color-text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {c.description}
                </p>
              )}

              <div style={{ display: "flex", gap: 16, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                <span>Start: <strong style={{ color: "var(--color-text-secondary)" }}>{formatDate(c.start_date)}</strong></span>
                <span>End: <strong style={{ color: "var(--color-text-secondary)" }}>{formatDate(c.end_date)}</strong></span>
              </div>

              {c.rejection_reason && (
                <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.07)", borderRadius: "var(--radius-sm)", border: "1px solid #fecaca" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-error)", marginBottom: 2 }}>Rejection reason</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{c.rejection_reason}</p>
                </div>
              )}

              <div style={{ paddingTop: 4, borderTop: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Submitted {formatDate(c.submitted_at)}</span>
                <Link
                  href={`/dashboard/client/campaigns/${c.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
                >
                  View details <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}