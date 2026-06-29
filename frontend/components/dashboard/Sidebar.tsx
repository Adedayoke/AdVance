"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  MapPin,
  ClipboardList,
  Users,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  UserPlus,
  Camera,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";
import { resolveAssetUrl } from "@/lib/api";
import type { UserRole } from "@/types";

// ─── Nav config per role ───────────────────────────────────────────────────

const NAV: Record<UserRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { href: "/dashboard/admin",           label: "Overview",         icon: LayoutDashboard },
    { href: "/dashboard/admin/campaigns", label: "Campaigns",        icon: Megaphone       },
    { href: "/dashboard/admin/locations", label: "Locations",        icon: MapPin          },
    { href: "/dashboard/admin/tasks",     label: "Tasks",            icon: ClipboardList   },
    { href: "/dashboard/admin/users",     label: "Users",            icon: Users           },
    { href: "/dashboard/admin/staff",     label: "Add Staff",        icon: UserPlus        },
    { href: "/dashboard/admin/agency",    label: "Agency settings",  icon: Building2       },
  ],
  client: [
    { href: "/dashboard/client",              label: "Overview",   icon: LayoutDashboard },
    { href: "/dashboard/client/campaigns",    label: "Campaigns",  icon: Megaphone       },
  ],
  staff: [
    { href: "/dashboard/staff",        label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/staff/tasks",  label: "My Tasks", icon: ClipboardList   },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  staff: "Field Staff",
  client: "Client",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#7c3aed",
  staff: "var(--color-success)",
  client: "var(--color-primary)",
};

interface SidebarProps {
  onNavigate?: () => void; // called when a link is clicked (for mobile close)
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = NAV[user.role];
  const initials = user.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  function isActive(href: string) {
    // Exact match for overview, prefix match for sub-pages
    if (href.endsWith("/admin") || href.endsWith("/client") || href.endsWith("/staff")) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: "var(--color-sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
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
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
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
              fontSize: "1.25rem",
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            AdVance
          </span>
        </Link>
      </div>

      {/* Role badge */}
      <div style={{ padding: "14px 20px 10px" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ROLE_COLORS[user.role],
            background: `${ROLE_COLORS[user.role]}1a`,
            padding: "3px 8px",
            borderRadius: "var(--radius-full)",
          }}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "4px 12px", overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                marginBottom: 2,
                background: active
                  ? "var(--color-sidebar-active-bg)"
                  : "transparent",
                color: active
                  ? "var(--color-sidebar-text-active)"
                  : "var(--color-sidebar-text)",
                fontWeight: active ? 600 : 400,
                fontSize: "0.9rem",
                transition: "background var(--transition-fast), color var(--transition-fast)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--color-sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent";
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 20,
                    background: "var(--color-accent)",
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}
              <Icon size={17} style={{ flexShrink: 0 }} />
              {item.label}
              {active && (
                <ChevronRight
                  size={14}
                  style={{ marginLeft: "auto", opacity: 0.5 }}
                />
              )}
            </Link>
          );
        })}

        {/* Staff: upload shortcut */}
        {user.role === "staff" && (
          <Link
            href="/dashboard/staff/tasks"
            onClick={onNavigate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              marginTop: 12,
              background: "rgba(245,158,11,0.12)",
              color: "var(--color-accent)",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <Camera size={16} />
            Upload Deployment
          </Link>
        )}

        {/* Client: new campaign shortcut */}
        {user.role === "client" && (
          <Link
            href="/dashboard/client/campaigns/new"
            onClick={onNavigate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              marginTop: 12,
              background: "rgba(245,158,11,0.12)",
              color: "var(--color-accent)",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <Megaphone size={16} />
            New Campaign
          </Link>
        )}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-sidebar-text)",
            fontSize: "0.875rem",
            width: "100%",
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-sidebar-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "transparent")
          }
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-sidebar-text)",
            fontSize: "0.875rem",
            width: "100%",
            transition: "background var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(239,68,68,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-sidebar-text)";
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>

        {/* User profile strip */}
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
            marginTop: 4,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.background =
              "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.background =
              "rgba(255,255,255,0.04)")
          }
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: ROLE_COLORS[user.role],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#ffffff",
              flexShrink: 0,
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#ffffff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.full_name}
            </p>
            <p
              style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.45)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}