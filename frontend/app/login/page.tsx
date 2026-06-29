"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";
import { useTheme } from "@/components/layout/ThemeProvider";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import { Sun, Moon } from "lucide-react";

const roleDashboards = {
  superadmin: "/dashboard/superadmin",
  admin: "/dashboard/admin",
  staff: "/dashboard/staff",
  client: "/dashboard/client",
} as const;

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(roleDashboards[user.role]);
    }
  }, [user, isLoading, router]);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await login(email.trim().toLowerCase(), password);
      // Redirect is handled inside login()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>

      {/* ── Left: Image panel ───────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "none",
        }}
        className="auth-image-panel"
      >
        <Image
          src="https://images.unsplash.com/photo-1467533003447-e295ff1b0435?w=1000&q=80&auto=format&fit=crop"
          alt="Billboard advertising"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,64,175,0.7) 100%)",
          }}
        />

        {/* Logo on image */}
        <div style={{ position: "absolute", top: 36, left: 36 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", fontFamily: "DM Serif Display, serif" }}>A</span>
            </div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "1.375rem", color: "#ffffff" }}>AdVance</span>
          </Link>
        </div>

        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: 48, left: 40, right: 40 }}>
          <p
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "1.75rem",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.35,
              marginBottom: 16,
              fontStyle: "italic",
            }}
          >
            &ldquo;Transparency between agencies and clients is no longer a
            luxury — it&apos;s a competitive necessity.&rdquo;
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 32, height: 2, background: "var(--color-accent)" }} />
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              AdVance Platform
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ───────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          padding: "0 40px",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
        }}
        className="auth-form-panel"
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            paddingBottom: 28,
          }}
        >
          {/* Mobile logo only */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }} className="auth-mobile-logo">
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.875rem", fontFamily: "DM Serif Display, serif" }}>A</span>
            </div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>AdVance</span>
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
              transition: "background var(--transition-fast)",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 48 }}>
          <div style={{ marginBottom: 36 }}>
            <h1
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "2rem",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)" }}>
              Sign in to your AdVance account
            </p>
          </div>

          {apiError && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant="error" message={apiError} onClose={() => setApiError("")} />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <FormField
              id="email"
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              error={errors.email}
              icon={<Mail size={16} />}
              autoComplete="email"
              autoFocus
            />

            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              error={errors.password}
              icon={<Lock size={16} />}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px 20px", marginTop: 4, fontSize: "0.9375rem" }}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", margin: 0 }}>
              New to AdVance?
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <Link
                href="/register/company"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  padding: "7px 16px",
                  border: "1px solid var(--color-primary)",
                  borderRadius: "var(--radius-full)",
                  transition: "background var(--transition-fast)",
                }}
              >
                Register your agency
              </Link>
              <Link
                href="/register"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                  padding: "7px 16px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  transition: "background var(--transition-fast)",
                }}
              >
                Join as a client
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            &copy; {new Date().getFullYear()} AdVance. Lagos State University Final Year Project.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-image-panel { display: block !important; }
          .auth-mobile-logo { display: none !important; }
        }
        .auth-form-panel {
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .auth-form-panel {
            max-width: 100% !important;
            padding: 0 24px !important;
          }
        }
        .btn-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
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