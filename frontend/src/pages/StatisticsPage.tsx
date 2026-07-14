import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileSearch,
  Gauge,
  History,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Button from "../components/common/Button";
import GlassCard from "../components/common/GlassCard";

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

// Base URL for the Express backend, read from the environment so the
// same build works against local, staging, and production APIs
// without code changes. Set VITE_API_BASE_URL in your .env file (see
// .env.example) — Vite only exposes variables prefixed with VITE_.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Endpoint for the logged-in user's prediction statistics. Protected
// by JWT on the backend — the token is already attached to axios's
// default headers by AuthContext on login/session restore, so it is
// deliberately NOT set manually anywhere in this file.
const STATISTICS_ENDPOINT = `${API_BASE_URL}/api/prediction/statistics`;

// How many characters of the latest prediction's text to show in the
// spotlight card before truncating.
const LATEST_PREVIEW_LENGTH = 200;

// --------------------------------------------------------------------------
// Local types (mirrors the backend's response contract for this route)
// --------------------------------------------------------------------------

type PredictionLabel = "Real" | "Fake";

interface LatestPrediction {
  _id: string;
  text: string;
  prediction: PredictionLabel;
  confidence: number; // 0–1
  createdAt: string; // ISO date string
}

interface PredictionStatistics {
  totalPredictions: number;
  fakeCount: number;
  realCount: number;
  averageConfidence: number; // 0–100
  fakePercentage: number; // 0–100
  realPercentage: number; // 0–100
  highestConfidence: number; // 0–100
  lowestConfidence: number; // 0–100
  latestPrediction: LatestPrediction | null;
}

interface StatisticsApiResponse {
  success: boolean;
  message?: string;
  data: PredictionStatistics;
}

type PageStatus = "loading" | "error" | "ready";

// --------------------------------------------------------------------------
// Small helpers
// --------------------------------------------------------------------------

function toPercent(value: number): string {
  return value.toFixed(1);
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Verdict-specific colors/icon, matching Dashboard/History's palette. */
function getVerdictPalette(prediction: PredictionLabel) {
  const isReal = prediction === "Real";
  return {
    isReal,
    Icon: isReal ? CheckCircle2 : ShieldAlert,
    border: isReal ? "border-verdict-real/30" : "border-verdict-fake/30",
    glow: isReal ? "bg-verdict-real/10" : "bg-verdict-fake/10",
    text: isReal ? "text-verdict-real" : "text-verdict-fake",
    badgeBg: isReal ? "bg-verdict-real/15" : "bg-verdict-fake/15",
    ring: isReal ? "ring-verdict-real/20" : "ring-verdict-fake/20",
    bar: isReal ? "bg-verdict-real" : "bg-verdict-fake",
  };
}

// --------------------------------------------------------------------------
// Animation variants
// --------------------------------------------------------------------------

const cardGridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function StatisticsPage() {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [stats, setStats] = useState<PredictionStatistics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetches the logged-in user's prediction statistics. The JWT is
   * attached automatically via axios's default headers (set by
   * AuthContext) — no manual token handling here.
   */
  const fetchStatistics = async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response =
        await axios.get<StatisticsApiResponse>(STATISTICS_ENDPOINT);
      const payload = response.data;

      if (!payload?.success || !payload.data) {
        throw new Error(
          payload?.message ||
            "The server response was missing statistics data.",
        );
      }

      setStats(payload.data);
      setStatus("ready");
    } catch (err) {
      let message = "Something went wrong while loading your statistics.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          message =
            (err.response.data as Partial<StatisticsApiResponse> | undefined)
              ?.message || `Request failed with status ${err.response.status}.`;
        } else if (err.request) {
          message =
            "Could not reach the server. Check your connection and try again.";
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setErrorMessage(message);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const hasAnyPredictions = (stats?.totalPredictions ?? 0) > 0;
  const latestPalette = stats?.latestPrediction
    ? getVerdictPalette(stats.latestPrediction.prediction)
    : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void">
      {/* Ambient background glow, consistent with the rest of the app */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-grad-radial-violet opacity-40"
      />

      {/* --- Header --- */}
      <header className="section-shell flex items-center justify-between py-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-sm font-semibold text-ink">
            AI Fake News Detector
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link to="/history">
            <Button
              variant="secondary"
              size="md"
              icon={<History className="h-4 w-4" />}
            >
              History
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button variant="secondary" size="md">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* --- Main content --- */}
      <main className="section-shell flex flex-col gap-8 pb-20 pt-4 sm:pt-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted">
            <BarChart3 className="h-3.5 w-3.5 text-violet-soft" />
            Statistics
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">
            Your prediction statistics
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
            A full breakdown of every article you've analyzed.
          </p>
        </motion.div>

        {/* --- Loading state --- */}
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-violet-soft" />
              <p className="text-sm text-ink-muted">Loading your statistics…</p>
            </GlassCard>
          </motion.div>
        )}

        {/* --- Error state --- */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            role="alert"
            className="flex flex-col items-start gap-4 rounded-2xl border border-verdict-fake/30 bg-verdict-fake/10 px-6 py-6 text-sm text-verdict-fake sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchStatistics}
              className="shrink-0"
            >
              Try again
            </Button>
          </motion.div>
        )}

        {/* --- Empty state: no predictions at all --- */}
        {status === "ready" && stats && !hasAnyPredictions && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-border">
                <FileSearch
                  className="h-7 w-7 text-ink-faint"
                  strokeWidth={1.7}
                />
              </span>
              <div>
                <p className="text-lg font-semibold text-ink">
                  No statistics yet
                </p>
                <p className="mt-1 max-w-sm text-sm text-ink-muted">
                  Analyze your first article and your stats will start showing
                  up here.
                </p>
              </div>
              <Link to="/dashboard">
                <Button variant="primary" size="md">
                  Analyze your first article
                </Button>
              </Link>
            </GlassCard>
          </motion.div>
        )}

        {/* --- Loaded statistics --- */}
        {status === "ready" && stats && hasAnyPredictions && (
          <>
            {/* Primary stat cards */}
            <motion.div
              variants={cardGridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              <motion.div variants={cardItemVariants}>
                <GlassCard className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.04]">
                      <ListChecks
                        className="h-5 w-5 text-violet-soft"
                        strokeWidth={1.8}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        Total Predictions
                      </p>
                      <p className="font-display text-2xl font-semibold text-ink">
                        {stats.totalPredictions}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <GlassCard className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 bg-verdict-real/15 ring-verdict-real/20">
                      <CheckCircle2
                        className="h-5 w-5 text-verdict-real"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        Real Predictions
                      </p>
                      <p className="font-display text-2xl font-semibold text-verdict-real">
                        {stats.realCount}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <GlassCard className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 bg-verdict-fake/15 ring-verdict-fake/20">
                      <ShieldAlert
                        className="h-5 w-5 text-verdict-fake"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        Fake Predictions
                      </p>
                      <p className="font-display text-2xl font-semibold text-verdict-fake">
                        {stats.fakeCount}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <GlassCard className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.04]">
                      <Gauge
                        className="h-5 w-5 text-azure-soft"
                        strokeWidth={1.8}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        Avg. Confidence
                      </p>
                      <p className="font-display text-2xl font-semibold text-ink">
                        {toPercent(stats.averageConfidence)}%
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>

            {/* Real vs Fake breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <GlassCard className="p-6 sm:p-8">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Real vs. Fake Breakdown
                </h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-verdict-real">
                        <CheckCircle2 className="h-4 w-4" />
                        Real
                      </span>
                      <span className="text-ink-muted">
                        {stats.realPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.realPercentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-verdict-real"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-verdict-fake">
                        <ShieldAlert className="h-4 w-4" />
                        Fake
                      </span>
                      <span className="text-ink-muted">
                        {stats.fakePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.fakePercentage}%` }}
                        transition={{
                          duration: 0.6,
                          ease: "easeOut",
                          delay: 0.1,
                        }}
                        className="h-full rounded-full bg-verdict-fake"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Confidence extremes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <GlassCard className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.04]">
                    <TrendingUp
                      className="h-5 w-5 text-violet-soft"
                      strokeWidth={1.8}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                      Highest Confidence
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {toPercent(stats.highestConfidence)}%
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.04]">
                    <TrendingDown
                      className="h-5 w-5 text-azure-soft"
                      strokeWidth={1.8}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                      Lowest Confidence
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {toPercent(stats.lowestConfidence)}%
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Latest prediction spotlight */}
            {stats.latestPrediction && latestPalette && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Latest Prediction
                </h2>
                <GlassCard
                  className={`relative overflow-hidden border p-6 ${latestPalette.border}`}
                >
                  <div
                    aria-hidden
                    className={`absolute -top-12 right-0 h-32 w-32 rounded-full blur-3xl ${latestPalette.glow}`}
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${latestPalette.badgeBg} ${latestPalette.ring}`}
                      >
                        <latestPalette.Icon
                          className={`h-5 w-5 ${latestPalette.text}`}
                          strokeWidth={2}
                        />
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${latestPalette.badgeBg} ${latestPalette.text}`}
                      >
                        {latestPalette.isReal ? "Real News" : "Fake News"}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                        Confidence
                      </p>
                      <p
                        className={`mt-0.5 font-display text-xl font-semibold ${latestPalette.text}`}
                      >
                        {toPercent(stats.latestPrediction.confidence)}%
                      </p>
                    </div>
                  </div>

                  <p className="relative mt-4 text-sm leading-relaxed text-ink-muted">
                    {truncateText(
                      stats.latestPrediction.text,
                      LATEST_PREVIEW_LENGTH,
                    )}
                  </p>

                  <div className="relative mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-xs text-ink-faint">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(stats.latestPrediction.createdAt)}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
