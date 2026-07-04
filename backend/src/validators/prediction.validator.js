import { ApiError } from "../utils/ApiError.js";

const MIN_LENGTH = 20;
const MAX_LENGTH = 10000;

/**
 * Validates the payload for POST /api/predict.
 *
 *   { text: string }
 *
 * - text is required and must be a string
 * - whitespace is trimmed before length checks
 * - trimmed length must be between MIN_LENGTH and MAX_LENGTH (inclusive)
 *
 * Throws an ApiError(400, ...) on any failure; otherwise returns the
 * trimmed text ready for the service layer.
 */
export function validatePredictionInput(body = {}) {
  const { text } = body;

  if (text === undefined || text === null || typeof text !== "string") {
    throw new ApiError(400, "\"text\" is required and must be a string.");
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    throw new ApiError(400, "\"text\" is required and cannot be empty.");
  }

  if (trimmedText.length < MIN_LENGTH) {
    throw new ApiError(
      400,
      `"text" must be at least ${MIN_LENGTH} characters long.`
    );
  }

  if (trimmedText.length > MAX_LENGTH) {
    throw new ApiError(
      400,
      `"text" must not exceed ${MAX_LENGTH} characters.`
    );
  }

  return trimmedText;
}
