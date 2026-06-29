"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Camera, Calendar, FileText, ExternalLink } from "lucide-react";
import { campaignsApi, deploymentsApi, ApiClientError, resolveAssetUrl } from "@/lib/api";
import type { Campaign, Deployment } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Alert from "@/components/ui/Alert";

export default function ClientCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [c, d] = await Promise.all([
          campaignsApi.getOne(id),
          deploymentsApi.byCampaign(id),
        ]);
        setCampaign(c);
        setDeployments(d);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load campaign");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  }

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Campaign Details</h1></div>
        <div className="card" style={{ height: 300, background: "var(--color-surface-raised)" }} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Campaign Details</h1></div>
        <Alert variant="error" message={error || "Campaign not found"} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500, marginBottom: 24, padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to campaigns
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">{campaign.title}</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 4 }}>
            Submitted {formatDate(campaign.submitted_at)}
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Rejection reason */}
      {campaign.rejection_reason && (
        <div style={{ marginBottom: 24, padding: "14px 16px", background: "rgba(239,68,68,0.07)", borderRadius: "var(--radius-sm)", border: "1px solid #fecaca" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-error)", marginBottom: 4 }}>Campaign rejected</p>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{campaign.rejection_reason}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Details card */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} style={{ color: "var(--color-primary)" }} /> Campaign details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }} className="detail-grid">
            <DetailRow label="Start date" value={formatDate(campaign.start_date)} />
            <DetailRow label="End date" value={formatDate(campaign.end_date)} />
            {campaign.approved_at && <DetailRow label="Approved on" value={formatDate(campaign.approved_at)} />}
            {campaign.description && (
              <div style={{ gridColumn: "1/-1" }}>
                <DetailRow label="Description" value={campaign.description} />
              </div>
            )}
          </div>

          {campaign.creative_url && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
              <p className="form-label" style={{ marginBottom: 10 }}>Creative file</p>
              <a
                href={resolveAssetUrl(campaign.creative_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ display: "inline-flex", fontSize: "0.875rem", gap: 6 }}
              >
                <ExternalLink size={14} /> View creative
              </a>
            </div>
          )}
        </div>

        {/* Locations */}
        {campaign.locations && campaign.locations.length > 0 && (
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={16} style={{ color: "var(--color-primary)" }} />
              Billboard locations ({campaign.locations.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {campaign.locations.map((loc) => (
                <div
                  key={loc.campaign_location_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--color-surface-raised)",
                    borderRadius: "var(--radius-sm)",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <MapPin size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{loc.name}</p>
                      <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)" }}>{loc.address}</p>
                    </div>
                  </div>
                  <StatusBadge status={loc.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deployment proofs */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Camera size={16} style={{ color: "var(--color-primary)" }} />
            Deployment proof ({deployments.length})
          </h2>

          {deployments.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", background: "var(--color-surface-raised)", borderRadius: "var(--radius-sm)" }}>
              <Camera size={28} style={{ color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                No deployment photos uploaded yet. They will appear here once field staff install your advertisements.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {deployments.map((d) => (
                <div key={d.id} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                  {/* Photo */}
                  <a href={resolveAssetUrl(d.photo_url)} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveAssetUrl(d.photo_url)}
                      alt="Deployment proof"
                      style={{ width: "100%", height: 160, objectFit: "cover", display: "block", transition: "opacity var(--transition-fast)" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </a>
                  <div style={{ padding: "12px" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>
                      {(d as Deployment & { location_name?: string }).location_name ?? "Location"}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 2 }}>
                      Uploaded by {(d as Deployment & { uploaded_by_name?: string }).uploaded_by_name ?? "Staff"}
                    </p>
                    {d.notes && <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: 4 }}>{d.notes}</p>}
                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={10} />
                      {formatDate(d.deployed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}