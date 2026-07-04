import { ApiError } from "../utils/ApiError.js";

/**
 * Catches any request that didn't match a route and forwards a 404
 * ApiError to the centralized error handler, keeping the response
 * shape consistent with every other error in the app.
 */
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
