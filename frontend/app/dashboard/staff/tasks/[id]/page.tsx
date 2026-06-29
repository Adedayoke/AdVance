"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Camera, Calendar, FileText,
  Upload, X, CheckCircle, ExternalLink, AlertCircle,
} from "lucide-react";
import { tasksApi, deploymentsApi, ApiClientError, resolveAssetUrl } from "@/lib/api";
import type { Task, TaskStatus } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Alert from "@/components/ui/Alert";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function StaffTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Deployment upload
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await tasksApi.listMine();
        const found = data.find((t) => t.id === id) ?? null;
        setTask(found);
        if (!found) setError("Task not found or not assigned to you.");
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load task");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handlePhotoSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoSelect(file);
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setUploadError("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude.toFixed(7),
          lng: pos.coords.longitude.toFixed(7),
        });
        setGettingLocation(false);
      },
      () => {
        setUploadError("Could not retrieve your location. You can still upload without it.");
        setGettingLocation(false);
      }
    );
  }

  async function handleStatusUpdate(newStatus: TaskStatus) {
    if (!task || task.status === newStatus) return;
    setUpdatingStatus(true);
    setStatusError("");
    try {
      await tasksApi.updateStatus(id, newStatus);
      setTask((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      setStatusError(err instanceof ApiClientError ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) { setUploadError("A deployment photo is required."); return; }
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("task_id", id);
      fd.append("photo", photo);
      if (notes.trim()) fd.append("notes", notes.trim());
      if (coords) {
        fd.append("latitude", coords.lat);
        fd.append("longitude", coords.lng);
      }
      await deploymentsApi.upload(fd);
      setUploadSuccess(true);
      setTask((prev) => prev ? { ...prev, status: "completed" } : prev);
      clearPhoto();
      setNotes("");
      setCoords(null);
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Task Details</h1></div>
        <div className="card" style={{ height: 300, background: "var(--color-surface-raised)" }} />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Task Details</h1></div>
        <Alert variant="error" message={error || "Task not found"} />
      </div>
    );
  }

  const isCompleted = task.status === "completed";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500, marginBottom: 24, padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to tasks
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">{task.campaign_title ?? "Deployment Task"}</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 4 }}>
            Assigned {formatDate(task.assigned_at)}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {uploadSuccess && (
        <div style={{ marginBottom: 20 }}>
          <Alert
            variant="success"
            message="Deployment photo uploaded successfully. The client has been notified."
            onClose={() => setUploadSuccess(false)}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Task info */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} style={{ color: "var(--color-primary)" }} /> Task details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Location */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                <MapPin size={16} />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Billboard location</p>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>{task.location_name ?? "—"}</p>
                {task.location_address && (
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{task.location_address}</p>
                )}
                {task.latitude && task.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${task.latitude},${task.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600, marginTop: 6 }}
                  >
                    <ExternalLink size={12} /> View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Campaign dates */}
            {(task.start_date || task.end_date) && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "rgba(8,145,178,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0891b2", flexShrink: 0 }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Campaign period</p>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", fontWeight: 600 }}>
                    {task.start_date ? formatDate(task.start_date) : "—"} – {task.end_date ? formatDate(task.end_date) : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Creative */}
            {task.creative_url && (
              <div style={{ paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Campaign creative</p>
                <a
                  href={resolveAssetUrl(task.creative_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ display: "inline-flex", fontSize: "0.875rem", gap: 6 }}
                >
                  <ExternalLink size={14} /> View creative file
                </a>
              </div>
            )}

            {/* Instructions */}
            {task.instructions && (
              <div style={{ padding: "14px 16px", background: "var(--color-surface-raised)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--color-primary)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Instructions</p>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{task.instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status update */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 16 }}>
            Update status
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusUpdate(opt.value)}
                disabled={updatingStatus || task.status === opt.value}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-sm)",
                  border: "2px solid",
                  borderColor: task.status === opt.value ? "var(--color-primary)" : "var(--color-border)",
                  background: task.status === opt.value ? "var(--color-primary)" : "transparent",
                  color: task.status === opt.value ? "#fff" : "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: task.status === opt.value ? "default" : "pointer",
                  transition: "all var(--transition-fast)",
                  opacity: updatingStatus ? 0.6 : 1,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {statusError && (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-error)", marginTop: 8 }}>{statusError}</p>
          )}
        </div>

        {/* Deployment upload */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Camera size={16} style={{ color: "var(--color-primary)" }} /> Upload proof of deployment
          </h2>
          <p style={{ fontSize: "0.8375rem", color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
            Take a clear photo of the installed advertisement and upload it here. Adding your GPS location strengthens the verification.
          </p>

          {isCompleted && !uploadSuccess ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "rgba(16,185,129,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid #a7f3d0" }}>
              <CheckCircle size={18} style={{ color: "var(--color-success)", flexShrink: 0 }} />
              <p style={{ fontSize: "0.9rem", color: "var(--color-success)", fontWeight: 600 }}>
                Deployment proof has already been uploaded for this task.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !photo && document.getElementById("deploy-photo-input")?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--color-primary)" : photo ? "var(--color-success)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: photo ? "12px" : "36px 24px",
                  textAlign: photo ? "left" : "center",
                  cursor: photo ? "default" : "pointer",
                  background: dragOver ? "var(--color-primary-light)" : "var(--color-surface-raised)",
                  transition: "all var(--transition-fast)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <input
                  id="deploy-photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
                />

                {photo && photoPreview ? (
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0, border: "1px solid var(--color-border)" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.name}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{(photo.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearPhoto(); }}
                        style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", fontWeight: 600, padding: 0 }}
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={30} style={{ color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
                    <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                      Drag & drop or click to upload
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      JPG, PNG, WEBP — taken on-site
                    </p>
                  </div>
                )}
              </div>

              {/* GPS capture */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={gettingLocation}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.875rem", flexShrink: 0 }}
                >
                  <MapPin size={14} />
                  {gettingLocation ? "Getting location..." : coords ? "Location captured" : "Capture GPS location"}
                </button>
                {coords && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={14} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--color-success)", fontWeight: 600 }}>
                      {coords.lat}, {coords.lng}
                    </span>
                  </div>
                )}
                {!coords && (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={13} /> Optional but recommended
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Any observations about the installation site, visibility, condition..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {uploadError && <Alert variant="error" message={uploadError} onClose={() => setUploadError("")} />}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={uploading || !photo}
                  className="btn-primary"
                  style={{ padding: "11px 28px" }}
                >
                  {uploading ? (
                    <><span className="btn-spinner" /> Uploading...</>
                  ) : (
                    <><Camera size={16} /> Submit deployment proof</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
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