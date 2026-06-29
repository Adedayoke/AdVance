"use client";

import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

type AlertVariant = "error" | "success" | "info" | "warning";

interface AlertProps {
  variant: AlertVariant;
  message: string;
  onClose?: () => void;
}

const config: Record<AlertVariant, { icon: typeof AlertCircle; color: string; bg: string; border: string }> = {
  error: {
    icon: AlertCircle,
    color: "var(--color-error)",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  success: {
    icon: CheckCircle,
    color: "var(--color-success)",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  info: {
    icon: Info,
    color: "var(--color-info)",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  warning: {
    icon: AlertCircle,
    color: "var(--color-warning)",
    bg: "#fffbeb",
    border: "#fde68a",
  },
};

export default function Alert({ variant, message, onClose }: AlertProps) {
  const { icon: Icon, color, bg, border } = config[variant];

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        background: bg,
        border: `1px solid ${border}`,
        fontSize: "0.875rem",
        color: color,
        lineHeight: 1.5,
      }}
    >
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color,
            display: "flex",
            padding: 0,
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}