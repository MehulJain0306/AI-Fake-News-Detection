import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setFormError(null);
    const result = await register(values.name, values.email, values.password);
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    navigate("/dashboard", { replace: true });
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
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Full name"
          autoComplete="name"
          placeholder="Jordan Rivera"
          value={values.name}
          onChange={handleChange("name")}
          error={errors.name}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          onChange={handleChange("password")}
          error={errors.password}
        />
        <FormField
          label="Confirm password"
          isPassword
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
