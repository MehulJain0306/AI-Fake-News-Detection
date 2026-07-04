import { asyncHandler } from "../utils/asyncHandler.js";
import { getHealthStatus } from "../services/health.service.js";

/**
 * GET /api/health
 * Returns the exact shape required by the spec:
 *   { status, message, version }
 * (Not wrapped in the generic success/data envelope, since this is
 * a fixed-contract health-check endpoint consumed by uptime tools.)
 */
export const getHealth = asyncHandler(async (req, res) => {
  const health = getHealthStatus();
  res.status(200).json(health);
});
