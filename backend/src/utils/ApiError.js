/**
 * Custom error class for operational errors (bad input, not found, etc.)
 * that should be reported to the client with a specific status code.
 * Throw this from controllers/services and let errorHandler format it.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
