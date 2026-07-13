import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2, LogIn } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import FormField from "../components/auth/FormField";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import {
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from "../utils/validators";

const INITIAL_VALUES: LoginFormValues = { email: "", password: "" };

// Framer Motion variants for staggering the form fields in on mount.
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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Used to give the form a quick "shake" whenever a new submit-level
  // error appears, for clearer, more tactile validation feedback.
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

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  const handleChange =
    (field: keyof LoginFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    };

  /**
   * Validates a single field as soon as the user leaves it, so mistakes
   * (bad email format, too-short password) surface immediately instead
   * of only after a failed submit.
   */
  const handleBlur = (field: keyof LoginFormValues) => () => {
    const fieldErrors = validateLoginForm(values);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setFormError(null);
    const result = await login(values.email, values.password);
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue verifying the news you read."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-violet-soft hover:text-violet"
          >
            Create one
          </Link>
        </>
      }
    >
      <motion.form
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
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              error={errors.password}
              disabled={isSubmitting}
            />
          </motion.div>
        </motion.div>

        {/* Submit-level error (e.g. invalid credentials, network failure) */}
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
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>

        {/* Subtle reassurance row, consistent with the auth aside's tone */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <LogIn className="h-3.5 w-3.5" />
          <span>Your session stays signed in on this device.</span>
        </div>
      </motion.form>
    </AuthShell>
  );
}