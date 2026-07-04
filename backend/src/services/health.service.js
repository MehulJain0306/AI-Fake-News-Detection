/**
 * Service layer for health-check data. Kept separate from the
 * controller so the "what" (data shape) is decoupled from the
 * "how" (HTTP request/response handling) — a pattern the rest of
 * the API will follow as more features are added.
 */
const APP_VERSION = "1.0.0";

export function getHealthStatus() {
  return {
    status: "OK",
    message: "AI Fake News Detection Backend Running",
    version: APP_VERSION,
  };
}
