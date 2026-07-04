import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, isPassword = false, type = "text", id, className = "", ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputType = isPassword ? (visible ? "text" : "password") : type;
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-ink-muted"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={`w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors duration-200 focus:bg-white/[0.05] focus:outline-none ${
              error
                ? "border-verdict-fake/60 focus:border-verdict-fake"
                : "border-border focus:border-violet-soft"
            } ${isPassword ? "pr-11" : ""} ${className}`}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink-muted"
            >
              {visible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-verdict-fake">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export default FormField;
