"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  colorBg?: string;
  trend?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "var(--color-primary)",
  colorBg = "var(--color-primary-light)",
  trend,
}: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: "22px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        transition: "box-shadow var(--transition-base)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-sm)",
          background: colorBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        {trend && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              marginTop: 6,
            }}
          >
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}