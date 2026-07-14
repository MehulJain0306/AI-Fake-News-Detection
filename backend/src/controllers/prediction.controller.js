import mongoose from "mongoose";
import Prediction from "../models/prediction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { validatePredictionInput } from "../validators/prediction.validator.js";
import { predictNews } from "../services/prediction.service.js";

/**
 * POST /api/predict
 * Body: { text: string }
 * Validates the input, runs it through the (mocked) prediction
 * service, and returns { prediction, confidence }.
 */
export const createPrediction = asyncHandler(async (req, res) => {
  const text = validatePredictionInput(req.body);
  const result = await predictNews(text);

  sendSuccess(res, {
    statusCode: 200,
    message: "Prediction generated successfully",
    data: result,
  });
});

/**
 * POST /api/prediction/save
 * Protected route — requires a valid JWT (see prediction.routes.js).
 *
 * Body: { text: string, prediction: "Fake" | "Real", confidence: number }
 *
 * Persists a prediction result against the currently authenticated user
 * (req.user._id, set by the existing JWT auth middleware) and returns
 * the saved document.
 */
export const savePrediction = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required to save a prediction.");
  }

  const { text, prediction, confidence } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    throw new ApiError(400, '"text" is required and must be a non-empty string.');
  }

  if (!["Fake", "Real"].includes(prediction)) {
    throw new ApiError(400, '"prediction" must be either "Fake" or "Real".');
  }

  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    throw new ApiError(400, '"confidence" must be a number between 0 and 1.');
  }

  const savedPrediction = await Prediction.create({
    user: userId,
    text: text.trim(),
    prediction,
    confidence,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Prediction saved successfully",
    data: savedPrediction,
  });
});

/**
 * GET /api/prediction/history
 * Protected route — requires a valid JWT (see prediction.routes.js).
 *
 * Returns only the predictions belonging to the currently authenticated
 * user (req.user._id), sorted newest first.
 */
export const getPredictionHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required to view prediction history.");
  }

  const history = await Prediction.find({ user: userId }).sort({ createdAt: -1 });

  sendSuccess(res, {
    statusCode: 200,
    message: "Prediction history retrieved successfully",
    data: history,
  });
});

/**
 * DELETE /api/prediction/:id
 * Protected route — requires a valid JWT (see prediction.routes.js).
 *
 * Deletes a single prediction, but only if it exists AND belongs to
 * the currently authenticated user. The ownership check is done as
 * part of the delete query itself (matching on both _id and user in
 * one atomic operation) rather than as a separate "find, then check,
 * then delete" sequence — this avoids a race condition and also
 * avoids leaking whether an id exists at all for a different user:
 * either way, a mismatch is reported as a generic 404.
 */
export const deletePrediction = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required to delete a prediction.");
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid prediction id.");
  }

  const deletedPrediction = await Prediction.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!deletedPrediction) {
    throw new ApiError(
      404,
      "Prediction not found, or you do not have permission to delete it."
    );
  }

  sendSuccess(res, {
    statusCode: 200,
    message: "Prediction deleted successfully",
    data: deletedPrediction,
  });
});

/**
 * DELETE /api/prediction/history
 * Protected route — requires a valid JWT (see prediction.routes.js).
 *
 * Deletes EVERY prediction belonging to the currently authenticated
 * user only. The query is scoped to `user: userId`, so it is
 * structurally impossible for this to touch another user's documents.
 *
 * NOTE: per your latest instruction, this reads the authenticated
 * user's id as req.user.id (not req.user._id, which the four functions
 * above still use — see the flag in my reply above this file).
 *
 * If the user has no predictions at all, this still responds with a
 * success response (deletedCount: 0) rather than an error — deleting
 * an already-empty history is not a failure condition.
 */
export const deleteAllPredictionHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      401,
      "Authentication required to delete prediction history."
    );
  }

  const result = await Prediction.deleteMany({ user: userId });

  const message =
    result.deletedCount > 0
      ? "Prediction history deleted successfully"
      : "No prediction history found to delete";

  sendSuccess(res, {
    statusCode: 200,
    message,
    data: { deletedCount: result.deletedCount },
  });
});

/**
 * GET /api/prediction/statistics
 * Protected route — requires a valid JWT (see prediction.routes.js).
 *
 * Returns aggregate statistics computed ONLY over the currently
 * authenticated user's predictions (req.user.id):
 *   - totalPredictions
 *   - fakeCount / realCount
 *   - averageConfidence (0–1 scale, matching how confidence is stored)
 *   - fakePercentage / realPercentage
 *   - highestConfidence / lowestConfidence
 *   - latestPrediction (the single most recent document)
 *
 * A single aggregation pipeline is used (via $facet) so the summary
 * numbers and the latest-prediction lookup are computed in one round
 * trip to MongoDB rather than two separate queries.
 */
export const getPredictionStatistics = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      401,
      "Authentication required to view prediction statistics."
    );
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [aggregationResult] = await Prediction.aggregate([
    { $match: { user: userObjectId } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalPredictions: { $sum: 1 },
              fakeCount: {
                $sum: { $cond: [{ $eq: ["$prediction", "Fake"] }, 1, 0] },
              },
              realCount: {
                $sum: { $cond: [{ $eq: ["$prediction", "Real"] }, 1, 0] },
              },
              averageConfidence: { $avg: "$confidence" },
              highestConfidence: { $max: "$confidence" },
              lowestConfidence: { $min: "$confidence" },
            },
          },
        ],
        latest: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
      },
    },
  ]);

  const summary = aggregationResult?.summary?.[0] ?? null;
  const latestPrediction = aggregationResult?.latest?.[0] ?? null;

  const totalPredictions = summary?.totalPredictions ?? 0;
  const fakeCount = summary?.fakeCount ?? 0;
  const realCount = summary?.realCount ?? 0;
  const averageConfidence = summary?.averageConfidence ?? 0;
  const highestConfidence = summary?.highestConfidence ?? 0;
  const lowestConfidence = summary?.lowestConfidence ?? 0;

  // Percentages are only meaningful once there's at least one
  // prediction — avoid a divide-by-zero and just report 0 instead.
  const fakePercentage =
    totalPredictions > 0 ? (fakeCount / totalPredictions) * 100 : 0;
  const realPercentage =
    totalPredictions > 0 ? (realCount / totalPredictions) * 100 : 0;

  sendSuccess(res, {
    statusCode: 200,
    message: "Prediction statistics retrieved successfully",
    data: {
      totalPredictions,
      fakeCount,
      realCount,
      averageConfidence:
      
  Math.round((averageConfidence ?? 0) * 10000) / 100,

  fakePercentage:
    Math.round(fakePercentage * 100) / 100,

  realPercentage:
    Math.round(realPercentage * 100) / 100,

  highestConfidence:
    Math.round((highestConfidence ?? 0) * 10000) / 100,

  lowestConfidence:
    Math.round((lowestConfidence ?? 0) * 10000) / 100,

  latestPrediction,
    },
  });
});