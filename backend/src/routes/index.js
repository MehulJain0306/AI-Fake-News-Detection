import { Router } from "express";
import healthRoutes from "./health.routes.js";
import predictionRoutes from "./prediction.routes.js";

const router = Router();

// Mount feature routers here as they are built.
// e.g. router.use("/analysis", analysisRoutes);
router.use("/health", healthRoutes);
router.use("/predict", predictionRoutes);

export default router;
