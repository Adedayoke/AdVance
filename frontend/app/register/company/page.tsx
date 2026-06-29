"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, User, Phone, Building2, ArrowRight, Sun, Moon, Globe,
} from "lucide-react";
import { authApi, ApiClientError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

const roleDashboards = {
  superadmin: "/dashboard/superadmin",
  admin:  "/dashboard/admin",
  staff:  "/dashboard/staff",
  client: "/dashboard/client",
} as const;

interface FormValues {
  company_name: string;
  company_email: string;
  company_phone: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  confirm_password: string;
}

interface FormErrors {
  company_name?: string;
  company_email?: string;
  admin_name?: string;
  admin_email?: string;
  admin_password?: string;
  confirm_password?: string;
}

export default function RegisterCompanyPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { theme, toggleTheme }           = useTheme();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    company_name: "",
    company_email: "",
    company_phone: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
  });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace(roleDashboards[user.role]);
  }, [user, isLoading, router]);

  function set(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
      setApiError("");
    };
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!values.company_name.trim())  e.company_name  = "Agency name is required";
    if (!values.company_email.trim()) e.company_email = "Agency email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.company_email))
      e.company_email = "Enter a valid email address";
    if (!values.admin_name.trim())    e.admin_name    = "Admin full name is required";
    if (!values.admin_email.trim())   e.admin_email   = "Admin email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.admin_email))
      e.admin_email = "Enter a valid email address";
    if (!values.admin_password)       e.admin_password = "Password is required";
    else if (values.admin_password.length < 8)
      e.admin_password = "Password must be at least 8 characters";
    if (!values.confirm_password)     e.confirm_password = "Please confirm your password";
    else if (values.admin_password !== values.confirm_password)
      e.confirm_password = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.registerCompany({
        company_name:   values.company_name.trim(),
        company_email:  values.company_email.trim().toLowerCase(),
        company_phone:  values.company_phone.trim() || undefined,
        admin_name:     values.admin_name.trim(),
        admin_email:    values.admin_email.trim().toLowerCase(),
        admin_password: values.admin_password,
      });
      await refreshUser();
      router.push("/dashboard/admin");
    } catch (err) {
      setApiError(
        err instanceof ApiClientError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Left image panel */}
      <div style={{ flex: 1, position: "relative", display: "none" }} className="auth-image-panel">
        <Image
          src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1200&q=80&auto=format&fit=crop"
          alt="Agency team working"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,64,175,0.72) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 36, left: 36 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", fontFamily: "DM Serif Display, serif" }}>A</span>
            </div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "1.375rem", color: "#ffffff" }}>
              AdVance
            </span>
          </Link>
        </div>
        <div style={{ position: "absolute", bottom: 48, left: 40, right: 40 }}>
          <h2
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "1.75rem",
              fontWeight: 400,
              color: "#ffffff",
              marginBottom: 24,
              lineHeight: 1.3,
            }}
          >
            Run your entire OOH operation from one platform.
          </h2>
          {[
            "Your own private workspace — staff, clients, and locations all in one place",
            "Clients register under your agency code and submit campaigns directly",
            "Field staff receive tasks and upload geo-tagged deployment evidence",
            "Full audit trail on every campaign from submission to completion",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--color-accent)", flexShrink: 0, marginTop: 7,
                }}
              />
              <span style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, lineHeight: 1.5 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          padding: "0 40px",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          overflowY: "auto",
        }}
        className="auth-form-panel"
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            paddingBottom: 20,
            position: "sticky",
            top: 0,
            background: "var(--color-surface)",
            zIndex: 1,
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
            className="auth-mobile-logo">
            <div
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.875rem", fontFamily: "DM Serif Display, serif" }}>A</span>
            </div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
              AdVance
            </span>
          </Link>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              padding: 8,
              borderRadius: 8,
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div style={{ paddingBottom: 48 }}>
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "1.875rem",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              Register your agency
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              Create your agency workspace. You&apos;ll be the admin — your clients and staff join under your agency code.
            </p>
          </div>

          {apiError && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant="error" message={apiError} onClose={() => setApiError("")} />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* ── Agency details ── */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 14 }}>
                Agency details
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <FormField
                  id="company_name"
                  label="Agency name"
                  type="text"
                  placeholder="e.g. BrightOut Media"
                  value={values.company_name}
                  onChange={set("company_name")}
                  error={errors.company_name}
                  icon={<Building2 size={16} />}
                  autoFocus
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField
                    id="company_email"
                    label="Agency email"
                    type="email"
                    placeholder="contact@agency.com"
                    value={values.company_email}
                    onChange={set("company_email")}
                    error={errors.company_email}
                    icon={<Globe size={16} />}
                  />
                  <FormField
                    id="company_phone"
                    label="Phone (optional)"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={values.company_phone}
                    onChange={set("company_phone")}
                    icon={<Phone size={16} />}
                  />
                </div>
              </div>
            </div>

            {/* ── Admin account ── */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 14 }}>
                Your admin account
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <FormField
                  id="admin_name"
                  label="Your full name"
                  type="text"
                  placeholder="e.g. Emeka Okafor"
                  value={values.admin_name}
                  onChange={set("admin_name")}
                  error={errors.admin_name}
                  icon={<User size={16} />}
                />
                <FormField
                  id="admin_email"
                  label="Your email address"
                  type="email"
                  placeholder="you@agency.com"
                  value={values.admin_email}
                  onChange={set("admin_email")}
                  error={errors.admin_email}
                  icon={<Mail size={16} />}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField
                    id="admin_password"
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={values.admin_password}
                    onChange={set("admin_password")}
                    error={errors.admin_password}
                    icon={<Lock size={16} />}
                    autoComplete="new-password"
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
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: "0.9375rem" }}
            >
              {submitting ? (
                <><span className="btn-spinner" /> Creating agency...</>
              ) : (
                <>Create agency account <ArrowRight size={16} /></>
              )}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
              By registering you agree to AdVance&apos;s terms of service and privacy policy.
            </p>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 8, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Are you a client?{" "}
            <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Register as a client
            </Link>
          </p>
        </div>

        <div style={{ paddingBottom: 28, textAlign: "center", marginTop: "auto" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            &copy; {new Date().getFullYear()} AdVance. Lagos State University Final Year Project.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .auth-image-panel { display: block !important; } .auth-mobile-logo { display: none !important; } }
        @media (max-width: 767px) { .auth-form-panel { max-width: 100% !important; padding: 0 20px !important; } }
        .btn-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 4px; }
      `}</style>
    </div>
  );
}
