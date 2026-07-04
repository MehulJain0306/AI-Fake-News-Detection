import { motion } from "framer-motion";
import { CheckCircle2, Radar, ShieldCheck } from "lucide-react";

const POINTS = [
  "Instant credibility scoring for any article or link",
  "Transparent confidence scores, never a black box",
  "Your scan history, saved and searchable",
];

export default function AuthAside() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-raised p-10 lg:flex">
      <div
        aria-hidden
        className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-grad-radial-violet blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-grad-radial-azure blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center gap-2.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-grad-primary shadow-glow-sm">
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
        </span>
        <span className="font-display text-base font-semibold text-ink">
          AI Fake News <span className="text-gradient">Detector</span>
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative"
      >
        <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted">
          <Radar className="h-3.5 w-3.5 text-violet-soft" />
          Real-time verification
        </span>
        <h2 className="max-w-sm text-3xl font-semibold leading-tight text-ink">
          Verify news with confidence, every time.
        </h2>
        <ul className="mt-8 space-y-4">
          {POINTS.map((point, i) => (
            <motion.li
              key={point}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.1 }}
              className="flex items-start gap-3 text-sm text-ink-muted"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verdict-real" />
              {point}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <p className="relative text-xs text-ink-faint">
        Built as a student AI/ML project to fight misinformation.
      </p>
    </div>
  );
}
