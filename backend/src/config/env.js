import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized, validated access to environment variables.
 * Import `env` anywhere instead of reading `process.env` directly,
 * so defaults and parsing live in exactly one place.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,

  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : "*",

  mongodbUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,

  // Base URL of the FastAPI prediction service.
  aiApiUrl: process.env.AI_API_URL,

  isProduction: process.env.NODE_ENV === "production",
};