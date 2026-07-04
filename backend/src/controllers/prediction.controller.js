import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
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
  const result = predictNews(text);

  sendSuccess(res, {
    statusCode: 200,
    message: "Prediction generated successfully",
    data: result,
  });
});
