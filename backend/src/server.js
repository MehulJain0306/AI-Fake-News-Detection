import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(
    `🚀 AI Fake News Detection backend running in ${env.nodeEnv} mode on http://localhost:${env.port}`
  );
});

// --- Graceful shutdown & safety nets ---
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
