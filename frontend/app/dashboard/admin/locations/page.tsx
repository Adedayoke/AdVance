"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, ToggleLeft, ToggleRight, Search, LocateFixed, Loader } from "lucide-react";
import { locationsApi, ApiClientError } from "@/lib/api";
import type { Location } from "@/types";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";

const FORMAT_OPTIONS = ["billboard", "transit", "street_furniture", "digital"];

const FORMAT_LABELS: Record<string, string> = {
  billboard: "Billboard",
  transit: "Transit",
  street_furniture: "Street Furniture",
  digital: "Digital",
};

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filtered, setFiltered] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add location modal
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", state: "", lga: "",
    format_type: "billboard", daily_rate: "", latitude: "", longitude: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Toggle availability
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await locationsApi.list();
      setLocations(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(locations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.state.toLowerCase().includes(q)
    ));
  }, [locations, search]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === 1 ? "Location access denied. Please allow location in your browser." :
          err.code === 2 ? "Location unavailable. Try entering coordinates manually." :
          "Location request timed out. Try again."
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function setField(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setFormError("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedForm = {
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      state: form.state.trim(),
      lga: form.lga.trim(),
      format_type: form.format_type.trim(),
      daily_rate: form.daily_rate.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
    };

    if (!trimmedForm.name || !trimmedForm.address || !trimmedForm.state || !trimmedForm.lga || !trimmedForm.format_type) {
      const missingFields: string[] = [];
      if (!trimmedForm.name) missingFields.push("name");
      if (!trimmedForm.address) missingFields.push("address");
      if (!trimmedForm.state) missingFields.push("state");
      if (!trimmedForm.lga) missingFields.push("LGA");
      if (!trimmedForm.format_type) missingFields.push("format");
      setFormError(`Missing required field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}`);
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const fd = new FormData();
      Object.entries(trimmedForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photo) fd.append("photo", photo);
      await locationsApi.create(fd);
      setAddOpen(false);
      setForm({ name: "", address: "", state: "", lga: "", format_type: "billboard", daily_rate: "", latitude: "", longitude: "" });
      setPhoto(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Failed to create location");
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleAvailability(loc: Location) {
    setTogglingId(loc.id);
    try {
      await locationsApi.update(loc.id, { is_available: !loc.is_available });
      setLocations((prev) => prev.map((l) => l.id === loc.id ? { ...l, is_available: !loc.is_available } : l));
    } catch {
      // fail silently
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">Manage your billboard inventory across Nigeria.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <Plus size={16} /> Add location
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input className="form-input" placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert variant="error" message={error} onClose={() => setError("")} /></div>}

      {/* Locations grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="card" style={{ height: 140, background: "var(--color-surface-raised)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
          {search ? "No locations match your search." : "No locations added yet. Click 'Add location' to get started."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((loc) => (
            <div key={loc.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                    <MapPin size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.name}</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAvailability(loc)}
                  disabled={togglingId === loc.id}
                  title={loc.is_available ? "Mark unavailable" : "Mark available"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: loc.is_available ? "var(--color-success)" : "var(--color-text-muted)", display: "flex", padding: 2, flexShrink: 0 }}
                >
                  {loc.is_available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="badge badge-submitted" style={{ fontSize: "0.7rem" }}>{FORMAT_LABELS[loc.format_type] ?? loc.format_type}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: "var(--radius-full)", background: loc.is_available ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: loc.is_available ? "var(--color-success)" : "var(--color-error)" }}>
                  {loc.is_available ? "Available" : "Unavailable"}
                </span>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "flex", justifyContent: "space-between" }}>
                <span>{loc.state}, {loc.lga}</span>
                {loc.daily_rate && <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦{Number(loc.daily_rate).toLocaleString()}/day</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add location modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setGeoError(""); }} title="Add billboard location" width={540}>
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Location name <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input className="form-input" placeholder="e.g. Ikeja Along Bridge" value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Address <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input className="form-input" placeholder="Full address" value={form.address} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div>
              <label className="form-label">State <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input className="form-input" placeholder="e.g. Lagos" value={form.state} onChange={(e) => setField("state", e.target.value)} />
            </div>
            <div>
              <label className="form-label">LGA <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input className="form-input" placeholder="e.g. Ikeja" value={form.lga} onChange={(e) => setField("lga", e.target.value)} />
            </div>
            <div>
              <label className="form-label">Format <span style={{ color: "var(--color-error)" }}>*</span></label>
              <select className="form-input" value={form.format_type} onChange={(e) => setField("format_type", e.target.value)} style={{ cursor: "pointer" }}>
                {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Daily rate (₦)</label>
              <input className="form-input" type="number" placeholder="e.g. 50000" value={form.daily_rate} onChange={(e) => setField("daily_rate", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Coordinates (optional)</p>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={geoLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-primary)",
                  background: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  fontSize: "0.8125rem", fontWeight: 600,
                  cursor: geoLoading ? "not-allowed" : "pointer",
                  opacity: geoLoading ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {geoLoading ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <LocateFixed size={13} />}
                {geoLoading ? "Detecting..." : "Use current location"}
              </button>
            </div>
            {geoError && (
              <div style={{ gridColumn: "1/-1", fontSize: "0.8125rem", color: "var(--color-error)", padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {geoError}
              </div>
            )}
            <div>
              <label className="form-label">Latitude</label>
              <input className="form-input" placeholder="e.g. 6.5244" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} />
            </div>
            <div>
              <label className="form-label">Longitude</label>
              <input className="form-input" placeholder="e.g. 3.3792" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Location photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }} />
            </div>
          </div>
          {formError && <Alert variant="error" message={formError} />}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary" style={{ padding: "9px 18px" }}>Cancel</button>
            <button type="submit" disabled={formLoading} className="btn-primary" style={{ padding: "9px 18px" }}>
              {formLoading ? "Adding..." : "Add location"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}