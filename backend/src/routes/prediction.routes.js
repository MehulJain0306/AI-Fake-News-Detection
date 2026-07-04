import { Router } from "express";
import { createPrediction } from "../controllers/prediction.controller.js";

const router = Router();

// POST /api/predict
router.post("/", createPrediction);

export default router;
