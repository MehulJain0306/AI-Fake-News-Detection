import { motion } from "framer-motion";
import { BrainCircuit, Gauge, History } from "lucide-react";
import GlassCard from "../common/GlassCard";
import type { FeatureItem } from "../../types/landing";

const FEATURES: FeatureItem[] = [
  {
    icon: BrainCircuit,
    title: "AI Fake News Detection",
    description:
      "A machine learning model trained on real and fabricated articles flags misleading claims by analyzing language patterns, not just keywords.",
    accent: "violet",
  },
  {
    icon: Gauge,
    title: "Confidence Score Analysis",
    description:
      "Every verdict ships with a transparent confidence percentage, so you see exactly how certain the model is — never a bare yes or no.",
    accent: "azure",
  },
  {
    icon: History,
    title: "Personal Scan History",
    description:
      "Every article you check is saved to your account, so you can revisit past results and track patterns over time.",
    accent: "violet",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-soft">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-ink sm:text-4xl">
            Everything you need to verify a claim
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Built for readers, students, and researchers who want a fast,
            explainable second opinion on what they're reading.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const glowClass =
              feature.accent === "violet"
                ? "from-violet/20 to-transparent"
                : "from-azure/20 to-transparent";
            return (
              <motion.div key={feature.title} variants={item}>
                <GlassCard hover className="group h-full p-7">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${glowClass} border border-border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        feature.accent === "violet" ? "text-violet-soft" : "text-azure-soft"
                      }`}
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
