"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, UserCheck, UserX, Eye } from "lucide-react";
import { usersApi, ApiClientError, resolveAssetUrl } from "@/lib/api";
import type { User, UserRole } from "@/types";
import Alert from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";

const ROLE_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Clients", value: "client" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: "#6b7280",
  admin: "#7c3aed",
  staff: "var(--color-success)",
  client: "var(--color-primary)",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [primeTogglingId, setPrimeTogglingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await usersApi.list(activeTab as UserRole || undefined);
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company_name ?? "").toLowerCase().includes(q)
    ));
  }, [users, search]);

  async function handleToggle(user: User) {
    setTogglingId(user.id);
    try {
      await usersApi.toggleActive(user.id);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch {
      // fail silently
    } finally {
      setTogglingId(null);
    }
  }

  async function handlePrimeToggle(user: User) {
    if (user.role !== "staff") return;
    setPrimeTogglingId(user.id);
    try {
      const next = !user.is_prime_staff;
      await usersApi.setPrimeStaff(user.id, next);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_prime_staff: next } : u)));
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, is_prime_staff: next } : prev));
      }
    } catch {
      // fail silently
    } finally {
      setPrimeTogglingId(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage client, staff, and administrator accounts.</p>
      </div>

      {/* Role tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {ROLE_TABS.map((tab) => (
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
        <input className="form-input" placeholder="Search by name, email or company..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert variant="error" message={error} onClose={() => setError("")} /></div>}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>No users found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: ROLE_COLORS[u.role], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                          {u.profile_picture_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resolveAssetUrl(u.profile_picture_url)} alt={u.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            initials(u.full_name)
                          )}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{u.full_name}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "inline-block", fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: `${ROLE_COLORS[u.role]}1a`, color: ROLE_COLORS[u.role], textTransform: "capitalize" }}>
                        {u.role}
                      </span>
                      {u.role === "staff" && u.is_prime_staff && (
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: 8,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "var(--radius-full)",
                            border: "1px solid var(--color-primary)",
                            color: "var(--color-primary)",
                          }}
                        >
                          Prime
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{u.company_name ?? "—"}</td>
                    <td style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{u.phone ?? "—"}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{formatDate(u.created_at)}</td>
                    <td>
                      <span style={{ display: "inline-block", fontSize: "0.75rem", fontWeight: 600, padding: "3px 8px", borderRadius: "var(--radius-full)", background: u.is_active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: u.is_active ? "var(--color-success)" : "var(--color-error)" }}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="View profile"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: 6,
                            border: "1px solid var(--color-border)",
                            cursor: "pointer",
                            background: "none",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={togglingId === u.id}
                          title={u.is_active ? "Deactivate user" : "Activate user"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: 6,
                            border: "1px solid",
                            cursor: "pointer",
                            background: "none",
                            borderColor: u.is_active ? "#fecaca" : "#a7f3d0",
                            color: u.is_active ? "var(--color-error)" : "var(--color-success)",
                            transition: "opacity var(--transition-fast)",
                            opacity: togglingId === u.id ? 0.5 : 1,
                          }}
                        >
                          {u.is_active ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                        </button>

                        {u.role === "staff" && (
                          <button
                            onClick={() => handlePrimeToggle(u)}
                            disabled={primeTogglingId === u.id}
                            title={u.is_prime_staff ? "Remove prime staff" : "Make prime staff"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              borderRadius: 6,
                              border: "1px solid",
                              cursor: "pointer",
                              background: "none",
                              borderColor: "var(--color-border)",
                              color: "var(--color-text-secondary)",
                              transition: "opacity var(--transition-fast)",
                              opacity: primeTogglingId === u.id ? 0.5 : 1,
                            }}
                          >
                            {u.is_prime_staff ? "Unprime" : "Make prime"}
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

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User profile" width={560}>
        {selectedUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: ROLE_COLORS[selectedUser.role], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                {selectedUser.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveAssetUrl(selectedUser.profile_picture_url)} alt={selectedUser.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  initials(selectedUser.full_name)
                )}
              </div>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{selectedUser.full_name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{selectedUser.email}</p>
              </div>
            </div>

            <DetailRow label="Role" value={selectedUser.role} />
            <DetailRow label="Status" value={selectedUser.is_active ? "Active" : "Inactive"} />
            <DetailRow label="Phone" value={selectedUser.phone ?? "—"} />
            <DetailRow label="Company" value={selectedUser.company_name ?? "—"} />
            <DetailRow label="Joined" value={formatDate(selectedUser.created_at)} />
            <DetailRow label="Last updated" value={formatDate(selectedUser.updated_at)} />

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
              <button onClick={() => setSelectedUser(null)} className="btn-secondary" style={{ fontSize: "0.875rem", padding: "8px 16px" }}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-muted)", width: 110, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", flex: 1, textTransform: label === "Role" ? "capitalize" : "none" }}>{value}</span>
    </div>
  );
}