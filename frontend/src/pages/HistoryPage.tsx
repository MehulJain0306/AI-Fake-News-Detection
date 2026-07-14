import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
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

// Endpoint for the logged-in user's prediction history. Protected by
// JWT on the backend — the token is already attached to axios's
// default headers by AuthContext on login/session restore, so it is
// deliberately NOT set manually anywhere in this file.
const HISTORY_ENDPOINT = `${API_BASE_URL}/api/prediction/history`;

// Base endpoint for deleting a single prediction: DELETE {base}/:id.
// Same JWT-protected pattern — token attached automatically.
const DELETE_PREDICTION_BASE_ENDPOINT = `${API_BASE_URL}/api/prediction`;

// How many characters of the article text to show before truncating
// in the card preview.
const PREVIEW_LENGTH = 180;

// How many characters of the article text to show inside the delete
// confirmation modal, so the user can confirm what they're removing.
const CONFIRM_PREVIEW_LENGTH = 100;

// How long a success/error toast stays on screen before auto-dismissing.
const TOAST_DURATION_MS = 3500;

// --------------------------------------------------------------------------
// Local types (mirrors the backend's response contract for this route)
// --------------------------------------------------------------------------

type PredictionLabel = "Real" | "Fake";

interface PredictionHistoryItem {
  _id: string;
  text: string;
  prediction: PredictionLabel;
  confidence: number; // 0–1, e.g. 0.91
  createdAt: string; // ISO date string
}

interface PredictionHistoryApiResponse {
  success: boolean;
  message?: string;
  data: PredictionHistoryItem[];
}

interface DeletePredictionApiResponse {
  success: boolean;
  message?: string;
  data?: PredictionHistoryItem;
}

interface DeleteAllHistoryApiResponse {
  success: boolean;
  message?: string;
  data?: { deletedCount: number };
}

type PageStatus = "loading" | "error" | "ready";

interface ToastState {
  type: "success" | "error";
  message: string;
}

// --------------------------------------------------------------------------
// Small helpers
// --------------------------------------------------------------------------

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

function toConfidencePercent(confidence: number): string {
  return (Math.round(confidence * 1000) / 10).toFixed(1);
}

/** Verdict-specific colors/icon, matching DashboardPage's result card palette. */
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
  };
}

// --------------------------------------------------------------------------
// Animation variants
// --------------------------------------------------------------------------

const listContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function HistoryPage() {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- State for deleting a single prediction ---
  // pendingDelete drives the confirmation modal: non-null means "show
  // the modal for this item". isDeleting tracks the in-flight request
  // so the modal can show a loading state and block double-submits.
  const [pendingDelete, setPendingDelete] =
    useState<PredictionHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // --- State for deleting the ENTIRE history ---
  // Kept fully separate from the single-item delete state above, so
  // the two flows can never interfere with each other.
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Auto-dismiss whatever toast is currently showing.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /**
   * Fetches the logged-in user's prediction history. The JWT is
   * attached automatically via axios's default headers (set by
   * AuthContext) — no manual token handling here.
   */
  const fetchHistory = async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response =
        await axios.get<PredictionHistoryApiResponse>(HISTORY_ENDPOINT);
      const payload = response.data;

      if (!payload?.success || !Array.isArray(payload.data)) {
        throw new Error(
          payload?.message || "The server response was missing history data.",
        );
      }

      // Defensive sort, newest first — the backend already sorts this
      // way, but guarding here keeps the UI correct even if that ever
      // changes upstream.
      const sorted = [...payload.data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setHistory(sorted);
      setStatus("ready");
    } catch (err) {
      let message = "Something went wrong while loading your history.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          message =
            (
              err.response.data as
                | Partial<PredictionHistoryApiResponse>
                | undefined
            )?.message || `Request failed with status ${err.response.status}.`;
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
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDeleteModal = (item: PredictionHistoryItem) =>
    setPendingDelete(item);

  /** Closes the confirmation modal — ignored while a delete is in flight. */
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setPendingDelete(null);
  };

  /**
   * Deletes the prediction currently held in `pendingDelete`. On
   * success, the matching card is removed from state immediately (no
   * page refresh, no refetch) and a success toast is shown. On
   * failure, the modal stays open with an error toast so the user can
   * retry or cancel.
   */
  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);

    try {
      const response = await axios.delete<DeletePredictionApiResponse>(
        `${DELETE_PREDICTION_BASE_ENDPOINT}/${pendingDelete._id}`,
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to delete this prediction.",
        );
      }

      const deletedId = pendingDelete._id;
      setHistory((prev) => prev.filter((item) => item._id !== deletedId));
      setToast({ type: "success", message: "Prediction deleted." });
      setPendingDelete(null);
    } catch (err) {
      let message = "Something went wrong while deleting this prediction.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          message =
            (
              err.response.data as
                | Partial<DeletePredictionApiResponse>
                | undefined
            )?.message || `Request failed with status ${err.response.status}.`;
        } else if (err.request) {
          message =
            "Could not reach the server. Check your connection and try again.";
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setToast({ type: "error", message });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteAllModal = () => setIsDeleteAllModalOpen(true);

  /** Closes the "delete all" modal — ignored while a delete is in flight. */
  const closeDeleteAllModal = () => {
    if (isDeletingAll) return;
    setIsDeleteAllModalOpen(false);
  };

  /**
   * Deletes the entire prediction history for the logged-in user. On
   * success, every card is cleared from state immediately (no page
   * refresh, no refetch) and a success toast is shown. On failure,
   * the modal stays open with an error toast so the user can retry
   * or cancel.
   */
  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);

    try {
      const response =
        await axios.delete<DeleteAllHistoryApiResponse>(HISTORY_ENDPOINT);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to delete your prediction history.",
        );
      }

      setHistory([]);
      setToast({
        type: "success",
        message: response.data?.message || "All prediction history deleted.",
      });
      setIsDeleteAllModalOpen(false);
    } catch (err) {
      let message = "Something went wrong while deleting your history.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          message =
            (
              err.response.data as
                | Partial<DeleteAllHistoryApiResponse>
                | undefined
            )?.message || `Request failed with status ${err.response.status}.`;
        } else if (err.request) {
          message =
            "Could not reach the server. Check your connection and try again.";
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setToast({ type: "error", message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => setSearchQuery("");

  // Filters the already-loaded history by article text, client-side.
  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) => item.text.toLowerCase().includes(query));
  }, [history, searchQuery]);

  const hasAnyHistory = history.length > 0;
  const hasSearchResults = filteredHistory.length > 0;

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
          <Button
            variant="secondary"
            size="md"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={openDeleteAllModal}
            disabled={!hasAnyHistory || status !== "ready"}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete All History
          </Button>

          <Link to="/statistics">
            <Button
              variant="secondary"
              size="md"
              icon={<BarChart3 className="h-4 w-4" />}
            >
              Statistics
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
        {/* Title + search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6"
        >
          <div>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted">
              <Clock className="h-3.5 w-3.5 text-violet-soft" />
              Prediction History
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">
              Every article you've analyzed
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
              A running record of your past checks, newest first.
            </p>
          </div>

          {/* Search box */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search your history by article text…"
              disabled={status !== "ready"}
              className="w-full rounded-xl border border-border bg-white/[0.03] py-2.5 pl-11 pr-10 text-sm text-ink placeholder:text-ink-faint transition-colors duration-200 focus:border-violet-soft focus:bg-white/[0.05] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
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
              <p className="text-sm text-ink-muted">Loading your history…</p>
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
              onClick={fetchHistory}
              className="shrink-0"
            >
              Try again
            </Button>
          </motion.div>
        )}

        {/* --- Empty state: no history at all --- */}
        {status === "ready" && !hasAnyHistory && (
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
                  No predictions yet
                </p>
                <p className="mt-1 max-w-sm text-sm text-ink-muted">
                  Once you analyze an article, it'll show up here so you can
                  come back to it later.
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

        {/* --- Empty state: search returned nothing --- */}
        {status === "ready" && hasAnyHistory && !hasSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
              <Search className="h-6 w-6 text-ink-faint" />
              <p className="text-sm text-ink-muted">
                No results match{" "}
                <span className="font-medium text-ink">"{searchQuery}"</span>.
              </p>
              <Button variant="ghost" size="md" onClick={clearSearch}>
                Clear search
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* --- Loaded history list --- */}
        {status === "ready" && hasSearchResults && (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((item) => {
                const palette = getVerdictPalette(item.prediction);
                const Icon = palette.Icon;

                return (
                  <motion.div
                    key={item._id}
                    layout
                    variants={listItemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                  >
                    <GlassCard
                      hover
                      className={`relative overflow-hidden border p-6 min-h-[320px] flex flex-col ${palette.border}`}
                    >
                      {/* Soft tinted glow, matching the verdict color */}
                      <div
                        aria-hidden
                        className={`absolute -top-12 right-0 h-32 w-32 rounded-full blur-3xl ${palette.glow}`}
                      />

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.badgeBg} ${palette.ring}`}
                          >
                            <Icon
                              className={`h-5 w-5 ${palette.text}`}
                              strokeWidth={2}
                            />
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${palette.badgeBg} ${palette.text}`}
                          >
                            {palette.isReal ? "Real News" : "Fake News"}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                            Confidence
                          </p>
                          <p
                            className={`mt-0.5 font-display text-xl font-semibold ${palette.text}`}
                          >
                            {toConfidencePercent(item.confidence)}%
                          </p>
                        </div>
                      </div>

                      <p className="relative mt-4 text-sm leading-relaxed text-ink-muted">
                        {truncateText(item.text, PREVIEW_LENGTH)}
                      </p>

                      <div className="relative mt-5 flex items-center justify-between gap-2 border-t border-border pt-4 text-xs text-ink-faint">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(item.createdAt)}
                        </div>

                        <Button
                          variant="ghost"
                          size="md"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => openDeleteModal(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* --- Delete confirmation modal --- */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDeleteModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
              className="w-full max-w-sm"
            >
              <GlassCard className="p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdict-fake/15 ring-1 ring-verdict-fake/20">
                  <Trash2
                    className="h-6 w-6 text-verdict-fake"
                    strokeWidth={2}
                  />
                </span>

                <h2
                  id="delete-modal-title"
                  className="mt-4 text-lg font-semibold text-ink"
                >
                  Delete this prediction?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  "{truncateText(pendingDelete.text, CONFIRM_PREVIEW_LENGTH)}"
                  will be permanently removed from your history. This can't be
                  undone.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Cancel
                  </Button>

                  {/*
                    A dedicated destructive-action button rather than
                    Button's own variants: Button only offers
                    primary/secondary/ghost, none of which are styled
                    for a "danger" action. This reuses the app's
                    existing verdict-fake (red) token rather than
                    introducing a new color.
                  */}
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-verdict-fake px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-verdict-fake/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Delete ALL history confirmation modal --- */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <motion.div
            key="delete-all-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDeleteAllModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-all-modal-title"
              className="w-full max-w-sm"
            >
              <GlassCard className="p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdict-fake/15 ring-1 ring-verdict-fake/20">
                  <AlertTriangle
                    className="h-6 w-6 text-verdict-fake"
                    strokeWidth={2}
                  />
                </span>

                <h2
                  id="delete-all-modal-title"
                  className="mt-4 text-lg font-semibold text-ink"
                >
                  Delete your entire history?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  This will permanently delete{" "}
                  <span className="font-medium text-ink">
                    all {history.length} prediction
                    {history.length === 1 ? "" : "s"}
                  </span>{" "}
                  in your history. This action cannot be undone.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={closeDeleteAllModal}
                    disabled={isDeletingAll}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Cancel
                  </Button>

                  {/* Same dedicated destructive-action styling as the
                      single-delete modal, for the same reason: Button
                      has no "danger" variant of its own. */}
                  <button
                    type="button"
                    onClick={confirmDeleteAll}
                    disabled={isDeletingAll}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-verdict-fake px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-verdict-fake/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isDeletingAll ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {isDeletingAll ? "Deleting…" : "Delete All"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Success/error toast --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-5 py-3 text-sm shadow-card backdrop-blur-xl ${
              toast.type === "success"
                ? "border-verdict-real/30 bg-verdict-real/15 text-verdict-real"
                : "border-verdict-fake/30 bg-verdict-fake/15 text-verdict-fake"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
