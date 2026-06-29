"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Sun, Moon, Menu, X } from "lucide-react";

const roleDashboards = {
  superadmin: "/dashboard/superadmin",
  admin: "/dashboard/admin",
  staff: "/dashboard/staff",
  client: "/dashboard/client",
} as const;

export default function LandingNav() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "background var(--transition-slow), box-shadow var(--transition-slow)",
        background: scrolled ? "var(--color-surface)" : "transparent",
        boxShadow: scrolled ? "var(--shadow-md)" : "none",
        borderBottom: scrolled ? "1px solid var(--color-border)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
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
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", fontFamily: "DM Serif Display, serif" }}>A</span>
          </div>
          <span
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "1.375rem",
              fontWeight: 400,
              color: scrolled ? "var(--color-text-primary)" : "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            AdVance
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }} className="landing-nav-desktop">
          <a href="#how-it-works" className="landing-nav-link" style={{ color: scrolled ? "var(--color-text-secondary)" : "rgba(255,255,255,0.85)" }}>
            How it works
          </a>
          <a href="#features" className="landing-nav-link" style={{ color: scrolled ? "var(--color-text-secondary)" : "rgba(255,255,255,0.85)" }}>
            Features
          </a>
          <a href="#roles" className="landing-nav-link" style={{ color: scrolled ? "var(--color-text-secondary)" : "rgba(255,255,255,0.85)" }}>
            Who it&apos;s for
          </a>

          <div style={{ width: 1, height: 20, background: scrolled ? "var(--color-border)" : "rgba(255,255,255,0.25)", margin: "0 8px" }} />

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: scrolled ? "var(--color-text-secondary)" : "rgba(255,255,255,0.85)",
              display: "flex",
              padding: 6,
              borderRadius: 6,
              transition: "color var(--transition-fast)",
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <Link
              href={roleDashboards[user.role]}
              className="btn-primary"
              style={{ fontSize: "0.875rem", padding: "8px 18px" }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: scrolled ? "var(--color-text-primary)" : "#ffffff",
                  padding: "8px 14px",
                  borderRadius: 6,
                  transition: "background var(--transition-fast)",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/register/company"
                className="btn-primary"
                style={{ fontSize: "0.875rem", padding: "8px 18px" }}
              >
                Get started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="landing-nav-mobile-toggle"
          aria-label="Toggle menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: scrolled ? "var(--color-text-primary)" : "#ffffff",
            padding: 6,
          }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          style={{
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <a href="#how-it-works" className="landing-nav-link-mobile" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#features" className="landing-nav-link-mobile" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#roles" className="landing-nav-link-mobile" onClick={() => setMenuOpen(false)}>Who it&apos;s for</a>
          <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 6, display: "flex" }}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <Link href={roleDashboards[user.role]} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Sign in</Link>
                <Link href="/register/company" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .landing-nav-link {
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          transition: background var(--transition-fast), color var(--transition-fast);
        }
        .landing-nav-link:hover {
          background: rgba(255,255,255,0.1);
        }
        .landing-nav-link-mobile {
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-primary);
          padding: 10px 4px;
          border-radius: 6px;
          display: block;
        }
        .landing-nav-mobile-toggle { display: none; }
        @media (max-width: 768px) {
          .landing-nav-desktop { display: none !important; }
          .landing-nav-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
}