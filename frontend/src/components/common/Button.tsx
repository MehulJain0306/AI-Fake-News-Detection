import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-grad-primary text-white shadow-glow-sm hover:shadow-glow border border-transparent",
  secondary:
    "glass text-ink hover:bg-white/[0.08] hover:border-border-strong",
  ghost:
    "text-ink-muted hover:text-ink bg-transparent border border-transparent",
};

const sizeStyles: Record<Size, string> = {
  md: "text-sm px-5 py-2.5 gap-2",
  lg: "text-base px-7 py-3.5 gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "right",
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2, scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={`inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...(rest as any)}
      >
        {icon && iconPosition === "left" ? icon : null}
        {children}
        {icon && iconPosition === "right" ? icon : null}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
