import express from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import predictionRoutes from "./prediction.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/prediction", predictionRoutes);

export default router;