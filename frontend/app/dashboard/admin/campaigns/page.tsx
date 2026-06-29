"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { campaignsApi, ApiClientError, resolveAssetUrl } from "@/lib/api";
import type { Campaign } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Active", value: "active" },
  { label: "Pending Completion", value: "pending_completion" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Approve / reject modal state
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | "complete" | "view" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await campaignsApi.listAll(activeTab || undefined);
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      campaigns.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.client_name ?? "").toLowerCase().includes(q) ||
          (c.client_email ?? "").toLowerCase().includes(q)
      )
    );
  }, [campaigns, search]);

  function openModal(c: Campaign, type: "approve" | "reject" | "complete" | "view") {
    setSelected(c);
    setModalType(type);
    setRejectReason("");
    setActionError("");
  }

  function closeModal() {
    setSelected(null);
    setModalType(null);
    setRejectReason("");
    setActionError("");
  }

  async function handleApprove() {
    if (!selected) return;
    setActionLoading(true);
    setActionError("");
    try {
      await campaignsApi.approve(selected.id);
      closeModal();
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim()) {
      setActionError("A rejection reason is required");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await campaignsApi.reject(selected.id, rejectReason.trim());
      closeModal();
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!selected) return;
    setActionLoading(true);
    setActionError("");
    try {
      await campaignsApi.complete(selected.id);
      closeModal();
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Campaigns</h1>
        <p className="page-subtitle">Review, approve, or reject submitted campaigns.</p>
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
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input
          className="form-input"
          placeholder="Search by title or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError("")} />}

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading campaigns...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>No campaigns found.</div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)", maxWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        {c.creative_url && (
                          <div
                            style={{
                              width: 36,
                              height: 36,
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
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.title}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                      <div>{c.client_name ?? "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{c.client_email}</div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                      {formatDate(c.start_date)}<br />{formatDate(c.end_date)}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(c.submitted_at)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => openModal(c, "view")}
                          title="View details"
                          style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer", color: "var(--color-text-secondary)", padding: "5px 8px", display: "flex" }}
                        >
                          <Eye size={14} />
                        </button>
                        {c.status === "submitted" && (
                          <>
                            <button
                              onClick={() => openModal(c, "approve")}
                              title="Approve"
                              style={{ background: "none", border: "1px solid #a7f3d0", borderRadius: 6, cursor: "pointer", color: "var(--color-success)", padding: "5px 8px", display: "flex" }}
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => openModal(c, "reject")}
                              title="Reject"
                              style={{ background: "none", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", color: "var(--color-error)", padding: "5px 8px", display: "flex" }}
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {c.status === "pending_completion" && (
                          <button
                            onClick={() => openModal(c, "complete")}
                            title="Mark complete"
                            style={{ background: "none", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", color: "#16a34a", padding: "5px 8px", display: "flex" }}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View modal */}
      <Modal open={modalType === "view"} onClose={closeModal} title="Campaign details" width={560}>
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <DetailRow label="Title" value={selected.title} />
            <DetailRow label="Client" value={`${selected.client_name ?? "—"} (${selected.client_email ?? ""})`} />
            <DetailRow label="Status" value={<StatusBadge status={selected.status} />} />
            <DetailRow label="Start date" value={formatDate(selected.start_date)} />
            <DetailRow label="End date" value={formatDate(selected.end_date)} />
            {selected.description && <DetailRow label="Description" value={selected.description} />}
            {selected.rejection_reason && (
              <div style={{ padding: "12px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid #fecaca" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-error)", marginBottom: 4 }}>Rejection reason</p>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{selected.rejection_reason}</p>
              </div>
            )}
            {selected.creative_url && (
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 8 }}>Creative</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 140,
                      height: 80,
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveAssetUrl(selected.creative_url)}
                      alt={`${selected.title} creative`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <a href={resolveAssetUrl(selected.creative_url)} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: "0.8125rem", display: "inline-flex" }}>
                    View creative file
                  </a>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
              {selected.status === "submitted" && (
                <>
                  <button onClick={() => setModalType("reject")} className="btn-danger" style={{ fontSize: "0.875rem", padding: "8px 16px" }}>Reject</button>
                  <button onClick={() => setModalType("approve")} className="btn-primary" style={{ fontSize: "0.875rem", padding: "8px 16px" }}>Approve</button>
                </>
              )}
              {selected.status === "pending_completion" && (
                <button onClick={() => setModalType("complete")} className="btn-primary" style={{ fontSize: "0.875rem", padding: "8px 16px" }}>Mark complete</button>
              )}
              <button onClick={closeModal} className="btn-secondary" style={{ fontSize: "0.875rem", padding: "8px 16px" }}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Complete modal */}
      <Modal open={modalType === "complete"} onClose={closeModal} title="Mark campaign complete">
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
              Mark <strong style={{ color: "var(--color-text-primary)" }}>{selected.title}</strong> as completed after final review? The client will be notified immediately.
            </p>
            {actionError && <Alert variant="error" message={actionError} />}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={closeModal} className="btn-secondary" style={{ padding: "9px 18px" }}>Cancel</button>
              <button onClick={handleComplete} disabled={actionLoading} className="btn-primary" style={{ padding: "9px 18px" }}>
                {actionLoading ? "Marking..." : "Yes, mark complete"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve modal */}
      <Modal open={modalType === "approve"} onClose={closeModal} title="Approve campaign">
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
              Are you sure you want to approve <strong style={{ color: "var(--color-text-primary)" }}>{selected.title}</strong>? The client will be notified immediately.
            </p>
            {actionError && <Alert variant="error" message={actionError} />}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={closeModal} className="btn-secondary" style={{ padding: "9px 18px" }}>Cancel</button>
              <button onClick={handleApprove} disabled={actionLoading} className="btn-primary" style={{ padding: "9px 18px" }}>
                {actionLoading ? "Approving..." : "Yes, approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal open={modalType === "reject"} onClose={closeModal} title="Reject campaign">
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
              Provide a clear reason for rejecting <strong style={{ color: "var(--color-text-primary)" }}>{selected.title}</strong>. The client will see this message.
            </p>
            <div>
              <label className="form-label">Rejection reason <span style={{ color: "var(--color-error)" }}>*</span></label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="e.g. Creative dimensions do not match the selected billboard format..."
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setActionError(""); }}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            {actionError && <Alert variant="error" message={actionError} />}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={closeModal} className="btn-secondary" style={{ padding: "9px 18px" }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="btn-danger" style={{ padding: "9px 18px" }}>
                {actionLoading ? "Rejecting..." : "Reject campaign"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-muted)", width: 110, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", flex: 1 }}>{value}</span>
    </div>
  );
}