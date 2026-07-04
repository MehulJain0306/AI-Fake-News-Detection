import { motion } from "framer-motion";
import { ClipboardPaste, Cpu, FileBarChart, Sparkles } from "lucide-react";
import type { StepItem } from "../../types/landing";

const STEPS: StepItem[] = [
  {
    index: "01",
    title: "Paste News",
    description: "Drop in an article's text or paste a link to the story you want checked.",
    icon: ClipboardPaste,
  },
  {
    index: "02",
    title: "AI Analysis",
    description: "Our model parses the language, structure, and framing against known patterns.",
    icon: Cpu,
  },
  {
    index: "03",
    title: "Prediction",
    description: "You get a clear real-or-fake verdict along with a confidence score.",
    icon: Sparkles,
  },
  {
    index: "04",
    title: "View Report",
    description: "See a plain-language breakdown of what drove the result, saved to your history.",
    icon: FileBarChart,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-azure-soft">
            Process
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-ink sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Four steps between a headline you're unsure about and a
            confident answer.
          </p>
        </div>

        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-11 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block"
          />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                <div className="relative z-10 flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-border bg-surface-raised shadow-card">
                  <Icon className="h-7 w-7 text-violet-soft" strokeWidth={1.7} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-grad-primary text-[11px] font-semibold text-white">
                    {step.index}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-ink-muted">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
