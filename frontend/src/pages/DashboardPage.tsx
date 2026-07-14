import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Eraser,
  History,
  Loader2,
  LogOut,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Button from "../components/common/Button";
import GlassCard from "../components/common/GlassCard";
import { useAuth } from "../context/AuthContext";
import type {
  PredictionApiResponse,
  PredictionResult,
} from "../types/prediction";

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

// Base URL for the Express backend, read from the environment so the
// same frontend build can work in local development, staging, and
// production without changing the source code.
//
// Example (.env):

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Endpoint for generating a new prediction.
const PREDICTION_ENDPOINT = `${API_BASE_URL}/api/prediction`;

// Endpoint for saving a prediction to the authenticated user's
// history. The JWT token is automatically attached by AuthContext
// through axios defaults, so it is NOT added manually here.
const SAVE_HISTORY_ENDPOINT = `${API_BASE_URL}/api/prediction/save`;

// Client-side validation limits. These mirror the backend validation
// so obvious invalid requests are caught before they are sent.
const MIN_LENGTH = 20;
const MAX_LENGTH = 10000;

/**
 * Persists a completed prediction to the user's history.
 *
 * This is intentionally fire-and-forget from the caller's perspective:
 * it never throws. Saving history is a secondary side effect of a
 * successful analysis — if it fails (network blip, expired token,
 * etc.), the prediction the user already sees on screen must stay
 * exactly as it is. The failure is only logged for debugging.
 */
async function savePredictionToHistory(
  text: string,
  result: PredictionResult,
): Promise<void> {
  try {
    await axios.post(
      SAVE_HISTORY_ENDPOINT,
      { text, prediction: result.prediction, confidence: result.confidence },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    // Deliberately swallowed — history saving must never surface to
    // the UI or interrupt the prediction flow. Logged for visibility
    // during development only.
    console.error("Failed to save prediction to history:", err);
  }
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- Local state for the analysis flow ---
  const [articleText, setArticleText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived, live-updating character count (based on trimmed text, to
  // match how the backend measures length).
  const trimmedLength = useMemo(() => articleText.trim().length, [articleText]);
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_LENGTH;
  const isTooLong = trimmedLength > MAX_LENGTH;
  const canSubmit = trimmedLength >= MIN_LENGTH && !isTooLong && !isLoading;

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setArticleText(e.target.value);
    // Clear stale results/errors as soon as the user starts editing again,
    // so the screen never shows a verdict for text that's since changed.
    if (result) setResult(null);
    if (error) setError(null);
  };

  /** Resets the entire form back to its initial, empty state. */
  const handleClear = () => {
    setArticleText("");
    setResult(null);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  /**
   * Sends the current article text to the backend for analysis using
   * Axios, and updates state with either the resulting prediction or
   * a user-friendly error message.
   */
  const handleAnalyze = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post<PredictionApiResponse>(
        PREDICTION_ENDPOINT,
        { text: articleText.trim() },
        { headers: { "Content-Type": "application/json" } },
      );

      const payload = response.data;

      if (!payload?.success || !payload.data?.prediction) {
        throw new Error(
          payload?.message ||
            "The server response was missing prediction data.",
        );
      }

      setResult(payload.data);

      // Persist this prediction to the user's history. This never
      // blocks or affects the result already shown above — see
      // savePredictionToHistory's own try/catch for details.
      void savePredictionToHistory(articleText.trim(), payload.data);
    } catch (err) {
      let message = "Something went wrong while analyzing this article.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Server responded with a non-2xx status code.
          message =
            (err.response.data as Partial<PredictionApiResponse> | undefined)
              ?.message ||
            `Analysis failed with status ${err.response.status}.`;
        } else if (err.request) {
          // Request was made but no response was received.
          message =
            "Could not reach the analysis server. Check your connection and try again.";
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Derived display values for the result card ---
  const isReal = result?.prediction === "Real";
  const confidencePercent = result
    ? Math.round(result.confidence * 1000) / 10 // e.g. 0.913 -> 91.3
    : 0;

  const palette = isReal
    ? {
        border: "border-verdict-real/30",
        glow: "bg-verdict-real/10",
        text: "text-verdict-real",
        badgeBg: "bg-verdict-real/15",
        ring: "ring-verdict-real/20",
        bar: "bg-verdict-real",
      }
    : {
        border: "border-verdict-fake/30",
        glow: "bg-verdict-fake/10",
        text: "text-verdict-fake",
        badgeBg: "bg-verdict-fake/15",
        ring: "ring-verdict-fake/20",
        bar: "bg-verdict-fake",
      };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void">
      {/* Ambient background glow, consistent with the rest of the app */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-grad-radial-violet opacity-40"
      />

      {/* --- Header --- */}
      <header className="section-shell flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-sm font-semibold text-ink">
            AI Fake News Detector
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<History className="h-4 w-4" />}
            onClick={() => navigate("/history")}
          >
            History
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<BarChart3 className="h-4 w-4" />}
            onClick={() => navigate("/statistics")}
          >
            Statistics
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* --- Main content --- */}
      <main className="section-shell flex flex-col gap-8 pb-20 pt-4 sm:pt-8">
        {/* Greeting + logged-in user identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-violet-soft" />
            Welcome back
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">
            Hi {user?.name ?? "there"}, let's verify some news.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
            Signed in as{" "}
            <span className="font-medium text-ink">{user?.email}</span>. Paste
            an article below and our model will score its credibility in
            seconds.
          </p>
        </motion.div>

        {/* Analysis card: textarea + live counter + actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="p-6 sm:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyze();
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="news-text"
                  className="mb-2 block text-sm font-medium text-ink-muted"
                >
                  Paste the news article you want to verify
                </label>
                <textarea
                  id="news-text"
                  value={articleText}
                  onChange={handleTextChange}
                  disabled={isLoading}
                  rows={10}
                  placeholder="Paste an article's text here (minimum 20 characters)…"
                  className="w-full resize-y rounded-2xl border border-border bg-white/[0.03] px-4 py-3.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint transition-colors duration-200 focus:border-violet-soft focus:bg-white/[0.05] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />

                {/* Live character counter */}
                <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
                  <span className={isTooLong ? "text-verdict-fake" : ""}>
                    {isTooShort &&
                      `Enter at least ${MIN_LENGTH - trimmedLength} more character${
                        MIN_LENGTH - trimmedLength === 1 ? "" : "s"
                      }.`}
                    {isTooLong &&
                      `Article is too long by ${trimmedLength - MAX_LENGTH} characters.`}
                  </span>
                  <span
                    className={
                      isTooLong ? "font-medium text-verdict-fake" : undefined
                    }
                  >
                    {trimmedLength.toLocaleString()} /{" "}
                    {MAX_LENGTH.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!canSubmit}
                  icon={
                    isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ScanSearch className="h-4 w-4" />
                    )
                  }
                  className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isLoading ? "Analyzing…" : "Analyze News"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={isLoading || (!articleText && !result && !error)}
                  icon={<Eraser className="h-4 w-4" />}
                  onClick={handleClear}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Clear
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        {/* Error alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-verdict-fake/30 bg-verdict-fake/10 px-5 py-4 text-sm text-verdict-fake"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction result: green card for Real, red card for Fake */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`glass relative overflow-hidden rounded-2xl border p-6 sm:p-8 ${palette.border}`}
            >
              {/* Soft tinted glow behind the card content, matching the verdict color */}
              <div
                aria-hidden
                className={`absolute -top-16 right-0 h-40 w-40 rounded-full blur-3xl ${palette.glow}`}
              />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.badgeBg} ${palette.ring}`}
                  >
                    {isReal ? (
                      <CheckCircle2
                        className={`h-6 w-6 ${palette.text}`}
                        strokeWidth={2}
                      />
                    ) : (
                      <ShieldAlert
                        className={`h-6 w-6 ${palette.text}`}
                        strokeWidth={2}
                      />
                    )}
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                      Prediction
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${palette.badgeBg} ${palette.text}`}
                    >
                      {isReal ? "Real News" : "Fake News"}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                    Confidence
                  </p>
                  <p
                    className={`mt-1 font-display text-3xl font-semibold ${palette.text}`}
                  >
                    {confidencePercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Animated confidence progress bar */}
              <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  className={`h-full rounded-full ${palette.bar}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
