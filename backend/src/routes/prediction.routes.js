import { Router } from "express";
import {
  createPrediction,
  savePrediction,
  getPredictionHistory,
  deletePrediction,
  deleteAllPredictionHistory,
  getPredictionStatistics,
} from "../controllers/prediction.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/prediction
// Existing public prediction endpoint — unchanged, no auth required.
router.post("/", createPrediction);

// POST /api/prediction/save
// Protected — requires a valid JWT. Saves a prediction to history for
// the currently authenticated user.
router.post("/save", protect, savePrediction);

// GET /api/prediction/history
// Protected — requires a valid JWT. Returns the logged-in user's
// prediction history, newest first.
router.get("/history", protect, getPredictionHistory);

// DELETE /api/prediction/history
// Protected — requires a valid JWT. Deletes ALL predictions belonging
// to the currently authenticated user.
//
// IMPORTANT: this must be registered BEFORE "DELETE /:id" below.
// Express matches routes in the order they're defined, and "/:id" is
// a wildcard segment — if it came first, a request to
// "/api/prediction/history" would incorrectly match "/:id" with
// id === "history" instead of reaching this route.
router.delete("/history", protect, deleteAllPredictionHistory);

// GET /api/prediction/statistics
// Protected — requires a valid JWT. Returns aggregate statistics
// (totals, real/fake counts and percentages, confidence extremes,
// latest prediction) for the currently authenticated user only.
//
// IMPORTANT: same ordering reason as "/history" above — this must be
// registered BEFORE "GET /:id"-style wildcard routes, if any are ever
// added, or "statistics" would be misread as an :id value.
router.get("/statistics", protect, getPredictionStatistics);

// DELETE /api/prediction/:id
// Protected — requires a valid JWT. Deletes a single prediction, but
// only if it belongs to the currently authenticated user (enforced in
// the controller).
router.delete("/:id", protect, deletePrediction);

export default router;