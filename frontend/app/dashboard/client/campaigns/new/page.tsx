"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, CheckCircle, Upload, X } from "lucide-react";
import { campaignsApi, locationsApi, ApiClientError } from "@/lib/api";
import type { Location } from "@/types";
import Alert from "@/components/ui/Alert";
import FormField from "@/components/ui/FormField";

const FORMAT_LABELS: Record<string, string> = {
  billboard: "Billboard",
  transit: "Transit",
  street_furniture: "Street Furniture",
  digital: "Digital",
};

const STEPS = ["Campaign details", "Select locations", "Upload creative"];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locSearch, setLocSearch] = useState("");

  // Step 3
  const [creative, setCreative] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load locations on step 2
  useEffect(() => {
    if (step !== 1) return;
    setLocLoading(true);
    locationsApi.list()
      .then((data) => setLocations(data.filter((l) => l.is_available)))
      .catch(() => {})
      .finally(() => setLocLoading(false));
  }, [step]);

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Campaign title is required";
    if (!startDate) e.startDate = "Start date is required";
    if (!endDate) e.endDate = "End date is required";
    if (startDate && endDate && endDate < startDate) e.endDate = "End date must be after start date";
    return e;
  }

  function goNext() {
    if (step === 0) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setStep1Errors(errs); return; }
      setStep1Errors({});
    }
    if (step === 1 && selectedIds.length === 0) {
      return; // button is disabled
    }
    setStep((s) => s + 1);
  }

  function toggleLocation(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setCreative(file);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("start_date", startDate);
      fd.append("end_date", endDate);
      selectedIds.forEach((id) => fd.append("location_ids", id));
      if (creative) fd.append("creative", creative);

      await campaignsApi.submit(fd);
      router.push("/dashboard/client/campaigns");
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Handle scheduling conflict clearly
        if (err.data?.conflicts) {
          setSubmitError(
            `Scheduling conflict: ${(err.data.conflicts as Array<{ location_name: string }>)
              .map((c) => c.location_name)
              .join(", ")} ${(err.data.conflicts as Array<unknown>).length === 1 ? "is" : "are"} already booked for those dates.`
          );
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLocations = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(locSearch.toLowerCase()) ||
      l.state.toLowerCase().includes(locSearch.toLowerCase()) ||
      l.lga.toLowerCase().includes(locSearch.toLowerCase())
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => step === 0 ? router.back() : setStep((s) => s - 1)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500, marginBottom: 24, padding: 0 }}
      >
        <ArrowLeft size={16} /> {step === 0 ? "Back to campaigns" : `Back to ${STEPS[step - 1]}`}
      </button>

      <div className="page-header">
        <h1 className="page-title">New Campaign</h1>
        <p className="page-subtitle">Submit a new OOH advertising campaign for review.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "unset" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: i < step ? "var(--color-success)" : i === step ? "var(--color-primary)" : "var(--color-border)",
                color: i <= step ? "#fff" : "var(--color-text-muted)",
                fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, transition: "all var(--transition-base)",
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: i === step ? 700 : 400, color: i === step ? "var(--color-text-primary)" : "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? "var(--color-success)" : "var(--color-border)", margin: "0 12px", minWidth: 20, transition: "background var(--transition-base)" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Campaign details ────────────────────────────────────── */}
      {step === 0 && (
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <FormField
            id="title"
            label="Campaign title"
            type="text"
            placeholder="e.g. Pepsi Summer Campaign Lagos 2025"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setStep1Errors((p) => ({ ...p, title: "" })); }}
            error={step1Errors.title}
          />
          <div>
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Describe the campaign objectives, target audience, or any special instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormField
              id="start_date"
              label="Start date"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => { setStartDate(e.target.value); setStep1Errors((p) => ({ ...p, startDate: "" })); }}
              error={step1Errors.startDate}
            />
            <FormField
              id="end_date"
              label="End date"
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => { setEndDate(e.target.value); setStep1Errors((p) => ({ ...p, endDate: "" })); }}
              error={step1Errors.endDate}
            />
          </div>
        </div>
      )}

      {/* ── Step 1: Location picker ─────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedIds.length > 0 && (
            <div style={{ padding: "10px 14px", background: "var(--color-primary-light)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)" }}>
                {selectedIds.length} location{selectedIds.length !== 1 ? "s" : ""} selected
              </span>
              <button onClick={() => setSelectedIds([])} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 600 }}>
                Clear all
              </button>
            </div>
          )}

          <div style={{ position: "relative" }}>
            <MapPin size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input className="form-input" placeholder="Search by name, state or LGA..." value={locSearch} onChange={(e) => setLocSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>

          {locLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading available locations...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No available locations found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {filteredLocations.map((loc) => {
                const selected = selectedIds.includes(loc.id);
                return (
                  <div
                    key={loc.id}
                    onClick={() => toggleLocation(loc.id)}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: selected ? "var(--color-primary-light)" : "var(--color-surface)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <MapPin size={15} style={{ color: selected ? "var(--color-primary)" : "var(--color-text-muted)", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: selected ? "var(--color-primary)" : "var(--color-text-primary)", lineHeight: 1.3 }}>{loc.name}</p>
                      </div>
                      {selected && <CheckCircle size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", paddingLeft: 23 }}>{loc.address}</p>
                    <div style={{ paddingLeft: 23, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-surface-raised)", color: "var(--color-text-secondary)" }}>
                        {FORMAT_LABELS[loc.format_type] ?? loc.format_type}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{loc.state}, {loc.lga}</span>
                    </div>
                    {loc.daily_rate && (
                      <p style={{ paddingLeft: 23, fontSize: "0.775rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                        ₦{Number(loc.daily_rate).toLocaleString()}/day
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Creative upload ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p className="form-label">Campaign creative (optional)</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
              Upload your advertising creative. Accepted formats: JPG, PNG, WEBP, GIF. Max 16MB. You can submit without a creative and upload it later.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("creative-input")?.click()}
              style={{
                border: `2px dashed ${dragOver ? "var(--color-primary)" : creative ? "var(--color-success)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "36px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "var(--color-primary-light)" : creative ? "rgba(16,185,129,0.05)" : "var(--color-surface-raised)",
                transition: "all var(--transition-fast)",
              }}
            >
              <input
                id="creative-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setCreative(e.target.files?.[0] ?? null)}
              />
              {creative ? (
                <div>
                  <CheckCircle size={32} style={{ color: "var(--color-success)", margin: "0 auto 10px" }} />
                  <p style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>{creative.name}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    {(creative.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCreative(null); }}
                    style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
                  <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                    Drop your creative here, or click to browse
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>PNG, JPG, WEBP, GIF up to 16MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: "16px", background: "var(--color-surface-raised)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 4 }}>Campaign summary</p>
            <SummaryRow label="Title" value={title} />
            <SummaryRow label="Dates" value={`${startDate} to ${endDate}`} />
            <SummaryRow label="Locations" value={`${selectedIds.length} billboard${selectedIds.length !== 1 ? "s" : ""} selected`} />
            <SummaryRow label="Creative" value={creative ? creative.name : "Not uploaded (optional)"} />
          </div>

          {submitError && <Alert variant="error" message={submitError} onClose={() => setSubmitError("")} />}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
        <div />
        {step < 2 ? (
          <button
            onClick={goNext}
            disabled={step === 1 && selectedIds.length === 0}
            className="btn-primary"
            style={{ padding: "11px 24px" }}
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
            style={{ padding: "11px 24px" }}
          >
            {submitting ? (
              <><span className="btn-spinner" /> Submitting...</>
            ) : (
              <><CheckCircle size={16} /> Submit campaign</>
            )}
          </button>
        )}
      </div>

      <style>{`
        .btn-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 4px;
        }
      `}</style>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", width: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.8rem", color: "var(--color-text-primary)", fontWeight: 500, flex: 1 }}>{value}</span>
    </div>
  );
}