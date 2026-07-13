import axios from "axios";
import { env } from "../config/env.js";

// Base URL of the FastAPI prediction service, read from the backend
// environment configuration. The /predict path is appended here so
// only the service base URL needs to change between environments.
const AI_API_URL = `${env.aiApiUrl}/predict`;

export const predictNews = async (text) => {
  try {
    const response = await axios.post(AI_API_URL, {
      text,
    });

    return response.data;
  } catch (error) {
    console.error("AI Service Error:", error.response?.data || error.message);

    throw new Error("Unable to connect to AI Prediction Service");
  }
};