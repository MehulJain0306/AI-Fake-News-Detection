import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

/**
 * GET /
 * Simple welcome/landing response confirming the API is reachable.
 */
export const getRoot = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: "Welcome to the AI Fake News Detection API",
    data: {
      docs: "/api/health",
    },
  });
});
