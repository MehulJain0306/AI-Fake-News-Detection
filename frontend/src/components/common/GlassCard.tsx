import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export default function GlassCard({
  children,
  hover = false,
  className = "",
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={`glass rounded-2xl ${
        hover
          ? "transition-all duration-300 hover:bg-white/[0.06] hover:border-border-strong hover:-translate-y-1"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
