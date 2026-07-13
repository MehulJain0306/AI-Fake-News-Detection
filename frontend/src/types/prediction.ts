export interface PredictionResult {
  prediction: "Fake" | "Real";
  confidence: number;
}

export interface PredictionApiResponse {
  success: boolean;
  message: string;
  data: PredictionResult;
}