/**
 * Service layer for the (currently mocked) fake news prediction.
 *
 * NOTE: This does not call a real machine learning model yet. It
 * randomly returns "Real" or "Fake" with a plausible confidence
 * score, purely so the API contract exists for the frontend to
 * integrate against. Swap this out for a call to the Python/FastAPI
 * ML service once it's ready — the controller layer will not need
 * to change.
 */
const LABELS = ["Real", "Fake"];
const MIN_CONFIDENCE = 60;
const MAX_CONFIDENCE = 99.9;

function randomConfidence() {
  const value = Math.random() * (MAX_CONFIDENCE - MIN_CONFIDENCE) + MIN_CONFIDENCE;
  return Math.round(value * 10) / 10;
}

export function predictNews(text) {
  const prediction = LABELS[Math.floor(Math.random() * LABELS.length)];
  const confidence = randomConfidence();

  return {
    prediction,
    confidence,
  };
}
