import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import FormField from "../components/auth/FormField";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import {
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
} from "../utils/validators";

const INITIAL_VALUES: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// How long the success state stays on screen before redirecting, so the
// user actually gets to see the confirmation instead of it flashing by.
const SUCCESS_REDIRECT_DELAY_MS = 1500;

// Framer Motion variants for staggering the form fields in on mount —
// matches LoginPage's entrance animation exactly.
const fieldContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const fieldItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

interface PasswordStrength {
  level: StrengthLevel;
  label: string;
  score: number; // 0–4, used to size the meter
  barColor: string;
  textColor: string;
}

/**
 * Scores a password on a few simple heuristics (length, case mixing,
 * digits, special characters) and maps the result to a display level.
 * This is a UX nudge, not a security guarantee — the backend remains
 * the source of truth for what's actually acceptable.
 */
function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: "empty", label: "", score: 0, barColor: "", textColor: "" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      level: "weak",
      label: "Weak",
      score: 1,
      barColor: "bg-verdict-fake",
      textColor: "text-verdict-fake",
    };
  }
  if (score <= 2) {
    return {
      level: "fair",
      label: "Fair",
      score: 2,
      barColor: "bg-amber-400",
      textColor: "text-amber-400",
    };
  }
  if (score <= 3) {
    return {
      level: "good",
      label: "Good",
      score: 3,
      barColor: "bg-azure-soft",
      textColor: "text-azure-soft",
    };
  }
  return {
    level: "strong",
    label: "Strong",
    score: 4,
    barColor: "bg-verdict-real",
    textColor: "text-verdict-real",
  };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Shake the form whenever a new submit-level error appears, matching
  // the tactile feedback on LoginPage.
  const shakeControls = useAnimation();
  const previousFormError = useRef<string | null>(null);

  useEffect(() => {
    if (formError && formError !== previousFormError.current) {
      shakeControls.start({
        x: [0, -8, 8, -6, 6, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }
    previousFormError.current = formError;
  }, [formError, shakeControls]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(values.password),
    [values.password]
  );

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    };

  /**
   * Validates a single field as soon as the user leaves it, so mistakes
   * surface immediately instead of only after a failed submit. Also
   * re-checks confirmPassword whenever password itself is blurred,
   * since the two are interdependent.
   */
  const handleBlur = (field: keyof RegisterFormValues) => () => {
    const fieldErrors = validateRegisterForm(values);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field],
      ...(field === "password"
        ? { confirmPassword: fieldErrors.confirmPassword }
        : {}),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setFormError(null);
    const result = await register(values.name, values.email, values.password);

    if (!result.success) {
      setIsSubmitting(false);
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    // Keep the button in its submitting state and show a success
    // confirmation before navigating away, so the moment doesn't just
    // flash by unnoticed.
    setIsSuccess(true);
    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, SUCCESS_REDIRECT_DELAY_MS);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start verifying news in seconds — it's free."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-violet-soft hover:text-violet"
          >
            Log in
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          // --- Success state: replaces the form after a successful registration ---
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-verdict-real/15 ring-1 ring-verdict-real/30"
            >
              <CheckCircle2 className="h-8 w-8 text-verdict-real" strokeWidth={2} />
            </motion.span>
            <div>
              <p className="text-lg font-semibold text-ink">Account created!</p>
              <p className="mt-1 text-sm text-ink-muted">
                Taking you to your dashboard…
              </p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />
          </motion.div>
        ) : (
          // --- Form state ---
          <motion.form
            key="form"
            animate={shakeControls}
            className="flex flex-col gap-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <motion.div
              variants={fieldContainerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-5"
            >
              <motion.div variants={fieldItemVariants}>
                <FormField
                  label="Full name"
                  autoComplete="name"
                  placeholder="Jordan Rivera"
                  value={values.name}
                  onChange={handleChange("name")}
                  onBlur={handleBlur("name")}
                  error={errors.name}
                  disabled={isSubmitting}
                />
              </motion.div>

              <motion.div variants={fieldItemVariants}>
                <FormField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={errors.email}
                  disabled={isSubmitting}
                />
              </motion.div>

              <motion.div variants={fieldItemVariants}>
                <FormField
                  label="Password"
                  isPassword
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={values.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={errors.password}
                  disabled={isSubmitting}
                />

                {/* Password strength indicator */}
                <AnimatePresence>
                  {passwordStrength.level !== "empty" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-2.5 overflow-hidden"
                    >
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((segment) => (
                          <span
                            key={segment}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              segment < passwordStrength.score
                                ? passwordStrength.barColor
                                : "bg-white/[0.08]"
                            }`}
                          />
                        ))}
                      </div>
                      <p
                        className={`mt-1.5 text-xs font-medium ${passwordStrength.textColor}`}
                      >
                        {passwordStrength.label} password
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={fieldItemVariants}>
                <FormField
                  label="Confirm password"
                  isPassword
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={values.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  error={errors.confirmPassword}
                  disabled={isSubmitting}
                />
              </motion.div>
            </motion.div>

            {/* Submit-level error (e.g. email already registered, network failure) */}
            <AnimatePresence mode="wait">
              {formError && (
                <motion.div
                  key="form-error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.25 }}
                  role="alert"
                  className="flex items-start gap-2 overflow-hidden rounded-xl border border-verdict-fake/30 bg-verdict-fake/10 px-4 py-3 text-sm text-verdict-fake"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              icon={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )
              }
              className="mt-1 w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>

            {/* Subtle reassurance row, consistent with LoginPage */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-faint">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Your details are only used to secure your account.</span>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}