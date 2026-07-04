import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Button from "../common/Button";

export default function CTASection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="section-shell">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised px-6 py-16 text-center sm:px-12 sm:py-20"
        >
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 bg-grad-radial-violet blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 right-0 h-64 w-[500px] bg-grad-radial-azure blur-3xl"
          />

          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-grad-primary shadow-glow">
            <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2} />
          </span>

          <h2 className="relative mx-auto mt-6 max-w-xl text-3xl font-semibold text-ink sm:text-4xl">
            Stop guessing. Start verifying.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-muted">
            Run your first check in seconds — no credit card, no
            commitment, just a straight answer.
          </p>

          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Start Detecting Now
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
