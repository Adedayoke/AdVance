"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 16px 24px",
        overflowY: "auto",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          minHeight: "100dvh",
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="animate-fade-in"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          maxHeight: "calc(100dvh - 72px)",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              display: "flex",
              padding: 4,
              borderRadius: 6,
              transition: "color var(--transition-fast)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}