import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import AuthAside from "./AuthAside";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-grad-radial-violet opacity-40"
      />

      <div className="section-shell flex min-h-screen items-center py-10">
        <div className="grid w-full gap-6 lg:grid-cols-2 lg:gap-8">
          <AuthAside />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center"
          >
            <div className="mx-auto w-full max-w-md">
              <Link
                to="/"
                className="mb-8 flex items-center gap-2.5 lg:hidden"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary">
                  <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.4} />
                </span>
                <span className="font-display text-sm font-semibold text-ink">
                  AI Fake News Detector
                </span>
              </Link>

              <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>

              <div className="glass mt-8 rounded-2xl p-6 sm:p-8">
                {children}
              </div>

              <p className="mt-6 text-center text-sm text-ink-muted">
                {footer}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
