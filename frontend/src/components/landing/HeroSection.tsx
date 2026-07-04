import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "../common/Button";
import ScanDemo from "./ScanDemo";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pb-20 pt-36 sm:pt-40 lg:pb-28 lg:pt-48"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-grad-radial-violet opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black 40%, transparent 100%)",
        }}
      />

      <div className="section-shell grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-soft" />
            Trained on 40,000+ verified articles
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-6xl"
          >
            Know what's real
            <br />
            before you{" "}
            <span className="text-gradient">share it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            Paste any article or link and our AI model scores its
            credibility in seconds — backed by a transparent confidence
            score and a plain-language explanation, not a black box.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Analyze News
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex items-center gap-6 text-xs text-ink-faint"
          >
            <span>No sign-up required to try</span>
            <span className="h-1 w-1 rounded-full bg-ink-faint" />
            <span>Results in under 3 seconds</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="animate-float"
        >
          <ScanDemo />
        </motion.div>
      </div>
    </section>
  );
}
