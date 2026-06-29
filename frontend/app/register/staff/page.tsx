"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Phone, ArrowRight, Sun, Moon } from "lucide-react";
import { authApi, ApiClientError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

const roleDashboards = {
  superadmin: "/dashboard/superadmin",
  admin: "/dashboard/admin",
  staff: "/dashboard/staff",
  client: "/dashboard/client",
} as const;

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

export default function StaffRegisterPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteKey = useMemo(() => {
    const key = searchParams.get("key")?.trim();
    return key || "";
  }, [searchParams]);

  const [values, setValues] = useState<FormValues>({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && user) router.replace(roleDashboards[user.role]);
  }, [user, isLoading, router]);

  function set(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
      setApiError("");
      setSuccess("");
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
      e.confirm_password = "Please confirm your password";
    else if (values.password !== values.confirm_password)
      e.confirm_password = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    setSuccess("");

    if (!inviteKey) {
      setApiError("Missing invite code. Please use the staff invite link sent by your admin.");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await authApi.registerStaffWithKey({
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        phone: values.phone.trim() || undefined,
        staff_key: inviteKey,
      });

      await refreshUser();
      setSuccess("Registration successful. Redirecting...");
      setValues({ full_name: "", email: "", password: "", confirm_password: "", phone: "" });
      setTimeout(() => router.push("/dashboard/staff"), 400);
    } catch (err) {
      setApiError(
        err instanceof ApiClientError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  const canShowForm = Boolean(inviteKey);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      <div style={{ flex: 1, position: "relative", display: "none" }} className="auth-image-panel">
        <Image
          src="https://images.unsplash.com/photo-1557858310-9052820906f7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Modern advertising"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,64,175,0.65) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 36, left: 36 }}>
          <Link
            href="/"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1rem",
                  fontFamily: "DM Serif Display, serif",
                }}
              >
                A
              </span>
            </div>
            <span
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "1.375rem",
                color: "#ffffff",
              }}
            >
              AdVance
            </span>
          </Link>
        </div>

        <div style={{ position: "absolute", bottom: 48, left: 40, right: 40 }}>
          {[
            "Submit campaigns with creative uploads",
            "Real-time deployment tracking",
            "Geo-tagged proof of deployment",
            "Full campaign history and audit trail",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 500,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          padding: "0 40px",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          overflowY: "auto",
        }}
        className="auth-form-panel"
      >
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
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  fontFamily: "DM Serif Display, serif",
                }}
              >
                A
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "DM Serif Display, serif",
                  fontSize: "1.25rem",
                  color: "var(--color-text)",
                  lineHeight: 1.1,
                }}
              >
                AdVance
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                Staff registration
              </div>
            </div>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div style={{ paddingBottom: 34 }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Create your staff account</h1>
          <p style={{ margin: "8px 0 0", color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
            Use the invite link provided by your admin.
          </p>

          {!canShowForm && (
            <div style={{ marginTop: 18 }}>
              <Alert
                variant="error"
                message="This page requires an invite code. Please open the staff invite link sent to you."
              />
            </div>
          )}

          {apiError && (
            <div style={{ marginTop: 18 }}>
              <Alert variant="error" message={apiError} onClose={() => setApiError("")} />
            </div>
          )}

          {success && (
            <div style={{ marginTop: 18 }}>
              <Alert variant="success" message={success} onClose={() => setSuccess("")} />
            </div>
          )}

          {canShowForm && (
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}
            >
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

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ padding: "12px 18px", marginTop: 6 }}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner" /> Creating account...
                  </>
                ) : (
                  <>
                    Create account <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                Already have an account? <Link href="/login">Log in</Link>
              </div>
            </form>
          )}
        </div>

        <style>{`
          @media (min-width: 768px) { .auth-image-panel { display: block !important; } }
          @media (max-width: 767px) { .auth-form-panel { max-width: 100% !important; padding: 0 20px !important; } }
          .btn-spinner {
            display: inline-block; width: 14px; height: 14px;
            border: 2px solid rgba(255,255,255,0.35);
            border-top-color: #ffffff; border-radius: 50%;
            animation: spin 0.6s linear infinite; margin-right: 6px;
          }
        `}</style>
      </div>
    </div>
  );
}
