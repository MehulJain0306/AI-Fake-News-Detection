const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean =>
  EMAIL_REGEX.test(value.trim());

export const isValidPassword = (value: string): boolean => value.length >= 8;

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (!isValidPassword(values.password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function validateRegisterForm(
  values: RegisterFormValues
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (!isValidPassword(values.password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords must match.";
  }

  return errors;
}
