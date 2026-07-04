import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { getRoot } from "./controllers/root.controller.js";
import apiRoutes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.get("/", getRoot);
app.use("/api", apiRoutes);

// --- 404 handler (must come after all valid routes) ---
app.use(notFound);

// --- Centralized error handler (must be registered last) ---
app.use(errorHandler);

export default app;
