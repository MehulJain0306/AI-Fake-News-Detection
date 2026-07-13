import { Router } from "express";
import {
  createPrediction,
  savePrediction,
  getPredictionHistory,
  deletePrediction,
  deleteAllPredictionHistory,
} from "../controllers/prediction.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public prediction endpoint
router.post("/", createPrediction);

// Save prediction
router.post("/save", protect, savePrediction);

// Get prediction history
router.get("/history", protect, getPredictionHistory);

// Delete ALL history (must come BEFORE "/:id")
router.delete("/history", protect, deleteAllPredictionHistory);

// Delete a single prediction
router.delete("/:id", protect, deletePrediction);

export default router;