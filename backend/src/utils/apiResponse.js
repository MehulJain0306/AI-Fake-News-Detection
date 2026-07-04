/**
 * Reusable helpers for sending consistently shaped JSON responses.
 * Every successful response looks like:
 *   { success: true, message, data }
 * Every error response (see errorHandler middleware) looks like:
 *   { success: false, message, error }
 */

export function sendSuccess(res, { statusCode = 200, message = "Success", data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, { statusCode = 500, message = "Something went wrong", error = null } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
}
