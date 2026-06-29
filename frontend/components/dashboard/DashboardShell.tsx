"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <div className="dashboard-sidebar-desktop">
        <Sidebar onNavigate={closeMobile} />
      </div>

      {/* ── Mobile sidebar overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMobile}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 90,
            }}
          />
          {/* Sidebar drawer */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: 240,
              zIndex: 91,
            }}
            className="animate-fade-in"
          >
            <Sidebar onNavigate={closeMobile} />
          </div>
        </>
      )}

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Topbar
          onMenuToggle={() => setMobileOpen((v) => !v)}
          menuOpen={mobileOpen}
        />

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 28px",
          }}
          className="dashboard-main"
        >
          {children}
        </main>
      </div>

      <style>{`
        .dashboard-sidebar-desktop {
          height: 100%;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .dashboard-sidebar-desktop { display: none; }
          .dashboard-main { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}