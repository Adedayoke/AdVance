"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { ApiClientError, authApi } from "@/lib/api";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

interface FormValues {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

export default function CreateStaffPage() {
  const router = useRouter();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [inviteError, setInviteError] = useState<string>("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const [values, setValues] = useState<FormValues>({
    full_name: "", email: "", password: "",
    confirm_password: "", phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.getStaffKey();
        if (cancelled) return;
        if (res.staff_key && origin) {
          setInviteLink(
            `${origin}/register/staff?key=${encodeURIComponent(res.staff_key)}`
          );
        }
      } catch {
        // Ignore: key fetch is optional for this page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [origin]);

  function set(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
      setApiError("");
    };
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!values.full_name.trim()) e.full_name = "Full name is required";
    if (!values.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      e.email = "Enter a valid email address";
    if (!values.password) e.password = "Password is required";
    else if (values.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!values.confirm_password)
      e.confirm_password = "Please confirm the password";
    else if (values.password !== values.confirm_password)
      e.confirm_password = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    setSuccess("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      await authApi.registerInternal({
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: "staff",
        phone: values.phone.trim() || undefined,
      });

      setSuccess(`Staff account created for ${values.full_name.trim()}. They can now log in.`);
      setValues({ full_name: "", email: "", password: "", confirm_password: "", phone: "" });
    } catch (err) {
      setApiError(err instanceof ApiClientError ? err.message : "Failed to create staff account.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateInviteLink() {
    setInviteError("");
    setInviteLoading(true);
    setCopyStatus("idle");
    try {
      const res = await authApi.rotateStaffKey();
      if (!origin) {
        setInviteError("Unable to generate link in this environment.");
        return;
      }
      const url = `${origin}/register/staff?key=${encodeURIComponent(res.staff_key)}`;
      setInviteLink(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopyStatus("copied");
        window.setTimeout(() => setCopyStatus("idle"), 1500);
      } catch {
        // Clipboard may be blocked; link is still displayed.
      }
    } catch (err) {
      setInviteError(err instanceof ApiClientError ? err.message : "Failed to generate invite link.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) return;
    setInviteError("");
    setCopyStatus("idle");

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setInviteError("Copy failed. Please select the link and copy manually.");
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 560, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/dashboard/admin/users")}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500, marginBottom: 24, padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to users
      </button>

      <div className="page-header">
        <h1 className="page-title">Create staff account</h1>
        <p className="page-subtitle">
          Add a new field staff member. They will be able to log in immediately and receive deployment tasks.
        </p>
      </div>

      <div className="card" style={{ padding: "20px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Staff invite link</div>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
              Generate a link with a code in the URL. Staff will only see the registration form when opening this link.
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateInviteLink}
            disabled={inviteLoading}
            className="btn-secondary"
            style={{ padding: "10px 14px", whiteSpace: "nowrap" }}
          >
            {inviteLoading ? "Generating…" : "Generate link"}
          </button>
        </div>

        {inviteError && (
          <div style={{ marginTop: 12 }}>
            <Alert variant="error" message={inviteError} onClose={() => setInviteError("")} />
          </div>
        )}

        {inviteLink && (
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={inviteLink}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "0.875rem",
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "10px 14px" }}
              onClick={handleCopyInviteLink}
            >
              {copyStatus === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "28px" }}>
        {apiError && (
          <div style={{ marginBottom: 20 }}>
            <Alert variant="error" message={apiError} onClose={() => setApiError("")} />
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 20 }}>
            <Alert variant="success" message={success} onClose={() => setSuccess("")} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormField
            id="full_name"
            label="Full name"
            type="text"
            placeholder="e.g. Emeka Okafor"
            value={values.full_name}
            onChange={set("full_name")}
            error={errors.full_name}
            icon={<User size={16} />}
            autoComplete="name"
            autoFocus
          />

          <FormField
            id="email"
            label="Email address"
            type="email"
            placeholder="staff@yourcompany.com"
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            icon={<Mail size={16} />}
            autoComplete="email"
          />

          <FormField
            id="phone"
            label="Phone number (optional)"
            type="tel"
            placeholder="+234 800 000 0000"
            value={values.phone}
            onChange={set("phone")}
            icon={<Phone size={16} />}
            autoComplete="tel"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={values.password}
              onChange={set("password")}
              error={errors.password}
              icon={<Lock size={16} />}
              autoComplete="new-password"
              hint={!errors.password ? "At least 8 characters" : undefined}
            />
            <FormField
              id="confirm_password"
              label="Confirm password"
              type="password"
              placeholder="Repeat password"
              value={values.confirm_password}
              onChange={set("confirm_password")}
              error={errors.confirm_password}
              icon={<Lock size={16} />}
              autoComplete="new-password"
            />
          </div>

          <div
            style={{
              padding: "12px 14px",
              background: "var(--color-surface-raised)",
              borderRadius: "var(--radius-sm)",
              borderLeft: "3px solid var(--color-primary)",
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            This account will be created with the <strong>Field Staff</strong> role.
            Staff can receive deployment tasks and upload proof-of-deployment photos.
            Share these credentials securely with the staff member.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin/users")}
              className="btn-secondary"
              style={{ padding: "10px 20px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ padding: "10px 24px" }}
            >
              {submitting ? (
                <><span className="btn-spinner" /> Creating account...</>
              ) : (
                <>Create staff account <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .btn-spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #ffffff; border-radius: 50%;
          animation: spin 0.6s linear infinite; margin-right: 4px;
        }
      `}</style>
    </div>
  );
}