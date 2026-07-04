import { env } from "../config/env.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Centralized error handler. Must be registered last, after all
 * routes and other middleware. Any error passed to next(err) — or
 * thrown inside an asyncHandler-wrapped controller — ends up here.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  if (!env.isProduction) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  }

  return sendError(res, {
    statusCode,
    message,
    error: env.isProduction
      ? undefined
      : {
          details: err.details ?? null,
          stack: err.stack,
        },
  });
}
