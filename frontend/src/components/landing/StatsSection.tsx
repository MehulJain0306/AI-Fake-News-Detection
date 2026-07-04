import { motion } from "framer-motion";
import { FileSearch, Target, Users } from "lucide-react";
import GlassCard from "../common/GlassCard";
import AnimatedCounter from "./AnimatedCounter";
import type { StatItem } from "../../types/landing";

const STATS: StatItem[] = [
  {
    label: "Articles Analyzed",
    value: 128400,
    suffix: "+",
    icon: FileSearch,
  },
  {
    label: "Detection Accuracy",
    value: 94,
    suffix: "%",
    icon: Target,
  },
  {
    label: "Active Users",
    value: 6200,
    suffix: "+",
    icon: Users,
  },
];

export default function StatsSection() {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="section-shell">
        <GlassCard className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center gap-3 px-6 py-10 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.04] border border-border">
                  <Icon className="h-5 w-5 text-violet-soft" strokeWidth={1.8} />
                </span>
                <p className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-ink-muted">{stat.label}</p>
              </motion.div>
            );
          })}
        </GlassCard>
      </div>
    </section>
  );
}
