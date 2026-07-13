"""
app.py

FastAPI inference service for the Fake News Detection model.

Loads the trained TF-IDF vectorizer and Logistic Regression model
(produced by train_model.py) exactly once at application startup,
then exposes:

    POST /predict  - classify a piece of news text as Fake or Real
    GET  /health   - basic liveness/readiness check

Run directly with:
    python app.py
or with uvicorn's CLI:
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

import joblib
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")

# Must match the label convention used in train_model.py: 0 = Fake, 1 = Real
LABEL_MAP = {0: "Fake", 1: "Real"}

MIN_TEXT_LENGTH = 1

# Module-level holders for the loaded artifacts. Populated once during
# the lifespan startup hook below and reused across every request.
ml_model = None
vectorizer = None


# --------------------------------------------------------------------------
# Startup / shutdown lifecycle
# --------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Loads model.pkl and vectorizer.pkl into memory exactly once when
    the application starts, and keeps them in module-level variables
    for the lifetime of the process (no per-request disk I/O).
    """
    global ml_model, vectorizer

    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at: {MODEL_PATH}")
    if not os.path.exists(VECTORIZER_PATH):
        raise RuntimeError(f"Vectorizer file not found at: {VECTORIZER_PATH}")

    print("Loading model and vectorizer...")
    ml_model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("Model and vectorizer loaded successfully.")

    yield  # application runs while suspended here

    # --- Shutdown: nothing to clean up, but placeholder kept for clarity ---
    print("Shutting down Fake News Detection API.")


# --------------------------------------------------------------------------
# App instance
# --------------------------------------------------------------------------

app = FastAPI(
    title="Fake News Detection API",
    description="Predicts whether a news article is Fake or Real using a "
    "TF-IDF + Logistic Regression model.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Request / response schemas
# --------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """Request body for POST /predict."""

    text: str = Field(
        ...,
        description="The news article text to classify.",
        examples=["Government announces new economic policy today."],
    )

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, value: str) -> str:
        """Rejects missing/whitespace-only text early, before it reaches TF-IDF."""
        if value is None or not value.strip():
            raise ValueError("text must not be empty or whitespace only.")
        if len(value.strip()) < MIN_TEXT_LENGTH:
            raise ValueError(
                f"text must be at least {MIN_TEXT_LENGTH} character(s) long."
            )
        return value.strip()


class PredictResponse(BaseModel):
    """Response body for POST /predict."""

    prediction: str = Field(..., description='Either "Fake" or "Real".')
    confidence: float = Field(
        ..., description="Model confidence for the predicted label (0-1)."
    )


class HealthResponse(BaseModel):
    """Response body for GET /health."""

    status: str
    model_loaded: bool


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

@app.get("/", tags=["Home"])
async def root():
    return {
        "message": "Fake News Detection API Running"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Simple liveness/readiness check. Reports whether the model and
    vectorizer are loaded and ready to serve predictions.
    """
    return HealthResponse(
        status="OK",
        model_loaded=ml_model is not None and vectorizer is not None,
    )


@app.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Prediction"],
)
async def predict(payload: PredictRequest) -> PredictResponse:
    """
    Classifies the given news text as "Fake" or "Real" and returns the
    model's confidence (the probability of the predicted class).
    """
    if ml_model is None or vectorizer is None:
        # Should not happen if lifespan startup succeeded, but guarded
        # defensively in case this is ever imported/used unusually.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded yet. Please try again shortly.",
        )

    try:
        # Transform the input text using the already-fitted vectorizer.
        features = vectorizer.transform([payload.text])

        # Get class probabilities and pick the highest-probability class.
        probabilities = ml_model.predict_proba(features)[0]
        predicted_index = int(probabilities.argmax())
        confidence = float(probabilities[predicted_index])

        label = LABEL_MAP.get(predicted_index)
        if label is None:
            raise ValueError(f"Unrecognized predicted label index: {predicted_index}")

        return PredictResponse(prediction=label, confidence=round(confidence, 4))

    except ValueError as exc:
        # Covers malformed input the vectorizer/model can't handle.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input for prediction: {exc}",
        ) from exc
    except Exception as exc:  # noqa: BLE001 - final safety net for inference errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the prediction.",
        ) from exc


# --------------------------------------------------------------------------
# Entrypoint
# --------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)