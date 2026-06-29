"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { tasksApi, campaignsApi, usersApi, ApiClientError } from "@/lib/api";
import type { Task, Campaign, User } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtered, setFiltered] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [assignForm, setAssignForm] = useState({
    campaign_location_id: "",
    assigned_to: "",
    instructions: "",
  });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [assignError, setAssignError] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await tasksApi.listAll();
      setTasks(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(tasks.filter(
      (t) =>
        (t.campaign_title ?? "").toLowerCase().includes(q) ||
        (t.location_name ?? "").toLowerCase().includes(q) ||
        (t.staff_name ?? "").toLowerCase().includes(q)
    ));
  }, [tasks, search]);

  async function openAssign() {
    setAssignOpen(true);
    setAssignError("");
    setAssignForm({ campaign_location_id: "", assigned_to: "", instructions: "" });
    setSelectedCampaign(null);
    try {
      const [c, s] = await Promise.all([
        campaignsApi.listAll("approved"),
        usersApi.list("staff"),
      ]);
      setCampaigns(c);
      setStaffList(s);
    } catch {
      setAssignError("Failed to load campaigns or staff");
    }
  }

  async function handleCampaignSelect(id: string) {
    setAssignForm((p) => ({ ...p, campaign_location_id: "", }));
    setSelectedCampaign(null);
    if (!id) return;
    try {
      const detail = await campaignsApi.getOne(id);
      setSelectedCampaign(detail);
    } catch {
      setAssignError("Failed to load campaign details");
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignForm.campaign_location_id || !assignForm.assigned_to) {
      setAssignError("Campaign location and staff member are required");
      return;
    }
    setAssignLoading(true);
    setAssignError("");
    try {
      await tasksApi.assign({
        campaign_location_id: assignForm.campaign_location_id,
        assigned_to: assignForm.assigned_to,
        instructions: assignForm.instructions || undefined,
      });
      setAssignOpen(false);
      load();
    } catch (err) {
      setAssignError(err instanceof ApiClientError ? err.message : "Failed to assign task");
    } finally {
      setAssignLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Assign and track field deployment tasks.</p>
        </div>
        <button onClick={openAssign} className="btn-primary">
          <Plus size={16} /> Assign task
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input className="form-input" placeholder="Search by campaign, location or staff..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert variant="error" message={error} onClose={() => setError("")} /></div>}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
            {search ? "No tasks match your search." : "No tasks assigned yet."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Location</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>{t.campaign_title ?? "—"}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{t.location_name ?? "—"}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{t.staff_name ?? "—"}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{formatDate(t.assigned_at)}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {t.completed_at ? formatDate(t.completed_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign deployment task" width={520}>
        <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="form-label">Campaign (approved only) <span style={{ color: "var(--color-error)" }}>*</span></label>
            <select className="form-input" style={{ cursor: "pointer" }} onChange={(e) => handleCampaignSelect(e.target.value)} defaultValue="">
              <option value="">Select a campaign...</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCampaign?.locations && selectedCampaign.locations.length > 0 && (
            <div>
              <label className="form-label">Billboard location <span style={{ color: "var(--color-error)" }}>*</span></label>
              <select className="form-input" style={{ cursor: "pointer" }} value={assignForm.campaign_location_id} onChange={(e) => setAssignForm((p) => ({ ...p, campaign_location_id: e.target.value }))}>
                <option value="">Select a location...</option>
                {selectedCampaign.locations.map((l) => (
                  <option key={l.campaign_location_id} value={l.campaign_location_id}>
                    {l.name} — {l.address}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Assign to (staff) <span style={{ color: "var(--color-error)" }}>*</span></label>
            <select className="form-input" style={{ cursor: "pointer" }} value={assignForm.assigned_to} onChange={(e) => setAssignForm((p) => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">Select a staff member...</option>
              {staffList.filter((s) => s.is_active).map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} {s.email ? `(${s.email})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Instructions (optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Any special instructions for the field staff..."
              value={assignForm.instructions}
              onChange={(e) => setAssignForm((p) => ({ ...p, instructions: e.target.value }))}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {assignError && <Alert variant="error" message={assignError} />}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setAssignOpen(false)} className="btn-secondary" style={{ padding: "9px 18px" }}>Cancel</button>
            <button type="submit" disabled={assignLoading} className="btn-primary" style={{ padding: "9px 18px" }}>
              {assignLoading ? "Assigning..." : "Assign task"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}