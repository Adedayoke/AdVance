"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Menu, X, CheckCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resolveAssetUrl, notificationsApi } from "@/lib/api";
import type { Notification } from "@/types";

interface TopbarProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export default function Topbar({ onMenuToggle, menuOpen }: TopbarProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchNotifications() {
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      //
    }
  }

  async function markOneRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      //
    }
  }

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header
      style={{
        height: 60,
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="topbar-mobile-menu"
        aria-label="Toggle menu"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-secondary)",
          display: "none",
          padding: 4,
        }}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div style={{ position: "relative" }} ref={panelRef}>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
          style={{
            position: "relative",
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-surface-raised)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "none")
          }
        >
          <Bell size={17} />
          {unread > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--color-error)",
                color: "#fff",
                fontSize: "0.625rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--color-surface)",
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Notification panel */}
        {panelOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 340,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 200,
              overflow: "hidden",
            }}
            className="animate-fade-in"
          >
            {/* Panel header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>
                Notifications
                {unread > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: "var(--color-primary)",
                      color: "#fff",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {unread}
                  </span>
                )}
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-primary)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: "0.875rem",
                  }}
                >
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markOneRead(n.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      cursor: n.is_read ? "default" : "pointer",
                      background: n.is_read
                        ? "transparent"
                        : "var(--color-primary-light)",
                      transition: "background var(--transition-fast)",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                    onMouseEnter={(e) => {
                      if (!n.is_read)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "var(--color-surface-raised)";
                    }}
                    onMouseLeave={(e) => {
                      if (!n.is_read)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "var(--color-primary-light)";
                    }}
                  >
                    {!n.is_read && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "var(--color-primary)",
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: n.is_read ? 400 : 600,
                          color: "var(--color-text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </p>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {n.message}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#ffffff",
          flexShrink: 0,
          border: "2px solid var(--color-border)",
        }}
      >
        {user.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveAssetUrl(user.profile_picture_url)}
            alt={user.full_name}
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .topbar-mobile-menu { display: flex !important; }
        }
      `}</style>
    </header>
  );
}