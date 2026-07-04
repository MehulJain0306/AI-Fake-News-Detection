import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Radar } from "lucide-react";

interface ScanLine {
  id: string;
  text: string;
  verdict: "real" | "fake";
  delay: number;
}

const LINES: ScanLine[] = [
  { id: "l1", text: "Local council approves new river cleanup budget", verdict: "real", delay: 0.6 },
  { id: "l2", text: "Scientists confirm coffee cures insomnia overnight", verdict: "fake", delay: 1.4 },
  { id: "l3", text: "Regional airport reports record passenger traffic", verdict: "real", delay: 2.2 },
  { id: "l4", text: "Government to replace currency with seashells", verdict: "fake", delay: 3.0 },
];

export default function ScanDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-grad-radial-violet blur-2xl" />
      <div className="absolute -inset-8 -z-10 translate-x-10 translate-y-10 rounded-[2rem] bg-grad-radial-azure blur-2xl" />

      <div className="glass relative overflow-hidden rounded-3xl p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary">
              <Radar className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Live Analysis</p>
              <p className="text-xs text-ink-faint">scanning incoming feed…</p>
            </div>
          </div>
          <span className="flex h-2.5 w-2.5 rounded-full bg-verdict-real shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse-soft" />
        </div>

        <div className="relative mt-5 space-y-3">
          {LINES.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: line.delay, duration: 0.5, ease: "easeOut" }}
              className="flex items-start gap-3 rounded-xl border border-border bg-white/[0.02] p-3"
            >
              {line.verdict === "real" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verdict-real" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-verdict-fake" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] leading-snug text-ink-muted">
                  {line.text}
                </p>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: line.delay + 0.3, duration: 0.4 }}
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    line.verdict === "real"
                      ? "bg-verdict-real/10 text-verdict-real"
                      : "bg-verdict-fake/10 text-verdict-fake"
                  }`}
                >
                  {line.verdict === "real" ? "Verified" : "Flagged"}
                </motion.span>
              </div>
            </motion.div>
          ))}

          <motion.div
            aria-hidden
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-violet/15 to-transparent"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-ink-faint">
          <span>Model confidence</span>
          <span className="font-mono text-ink-muted">96.4%</span>
        </div>
      </div>
    </div>
  );
}
