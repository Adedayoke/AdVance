"use client";

import { InputHTMLAttributes, forwardRef, useState, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, icon, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor={id}
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </label>

        <div style={{ position: "relative" }}>
          {icon && (
            <div
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={inputType}
            className="form-input"
            style={{
              paddingLeft: icon ? 40 : 14,
              paddingRight: isPassword ? 44 : 14,
              borderColor: error ? "var(--color-error)" : undefined,
            }}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                display: "flex",
                padding: 0,
                transition: "color var(--transition-fast)",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {error && (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-error)", marginTop: 2 }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 2 }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
export default FormField;