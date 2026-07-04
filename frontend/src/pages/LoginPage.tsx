import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange("email")}
          error={errors.email}
        />
        <FormField
          label="Password"
          isPassword
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange("password")}
          error={errors.password}
        />

        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-verdict-fake/30 bg-verdict-fake/10 px-4 py-3 text-sm text-verdict-fake">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

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
      </form>
    </AuthShell>
  );
}
