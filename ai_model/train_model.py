"""
train_model.py

Trains a Logistic Regression classifier to detect fake news headlines/
articles using TF-IDF features, then persists the trained model and
vectorizer to disk for use by app.py (the FastAPI inference service).

Expected folder structure:

    ai_model/
    ├── dataset/
    │   ├── Fake.csv
    │   └── True.csv
    ├── model/                 <- model.pkl and vectorizer.pkl are saved here
    ├── train_model.py         <- this file
    └── app.py

Usage:
    python train_model.py
"""

import os
import re
import string

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "model")

FAKE_CSV_PATH = os.path.join(DATASET_DIR, "Fake.csv")
TRUE_CSV_PATH = os.path.join(DATASET_DIR, "True.csv")

MODEL_OUTPUT_PATH = os.path.join(MODEL_DIR, "model.pkl")
VECTORIZER_OUTPUT_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")

# Label convention: 0 = Fake, 1 = Real (True)
LABEL_FAKE = 0
LABEL_REAL = 1

RANDOM_STATE = 42
TEST_SIZE = 0.2
MAX_TFIDF_FEATURES = 10000


# --------------------------------------------------------------------------
# Step 1: Load datasets
# --------------------------------------------------------------------------

def load_datasets(fake_path: str, true_path: str) -> pd.DataFrame:
    """
    Loads Fake.csv and True.csv, assigns numeric labels, merges them
    into a single DataFrame, and returns it (unshuffled).
    """
    print("Loading datasets...")

    if not os.path.exists(fake_path):
        raise FileNotFoundError(f"Dataset not found: {fake_path}")

    if not os.path.exists(true_path):
         raise FileNotFoundError(f"Dataset not found: {true_path}")
    
    fake_df = pd.read_csv(fake_path)
    true_df = pd.read_csv(true_path)

    # Label fake news as 0 and true/real news as 1
    fake_df["label"] = LABEL_FAKE
    true_df["label"] = LABEL_REAL

    print(f"  Fake.csv: {len(fake_df)} rows")
    print(f"  True.csv: {len(true_df)} rows")

    combined_df = pd.concat([fake_df, true_df], ignore_index=True)
    print("\nDataset Distribution:")
    print(combined_df["label"].value_counts())
    print(f"  Combined dataset: {len(combined_df)} rows")

    return combined_df


# --------------------------------------------------------------------------
# Step 2: Text cleaning
# --------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """
    Normalizes a piece of text for TF-IDF vectorization:
    - lowercases the text
    - removes URLs
    - removes HTML tags/entities
    - removes punctuation and digits
    - collapses extra whitespace
    """
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)   # URLs
    text = re.sub(r"<.*?>", " ", text)                    # HTML tags
    text = re.sub(r"[^a-z\s]", " ", text)                 # punctuation/digits
    text = re.sub(r"\s+", " ", text).strip()               # extra whitespace

    return text


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Builds a single cleaned text column from the available text fields
    (title + body, when present) that the model will be trained on.
    """
    print("Cleaning text...")

    # Some versions of this dataset have separate "title" and "text"
    # columns; combine whichever are available into one field.
    title_col = df["title"] if "title" in df.columns else ""
    body_col = df["text"] if "text" in df.columns else ""

    df["content"] = (title_col.fillna("") + " " + body_col.fillna("")).str.strip()

    # Drop rows that ended up with no usable content at all
    df = df[df["content"].str.len() > 0].copy()

    df["clean_content"] = df["content"].apply(clean_text)

    # Drop rows that became empty after cleaning
    df = df[df["clean_content"].str.len() > 0].copy()

    return df


# --------------------------------------------------------------------------
# Step 3: Shuffle dataset
# --------------------------------------------------------------------------

def shuffle_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Shuffles the merged dataset so Fake/Real rows are interleaved."""
    print("Shuffling dataset...")
    return df.sample(
        frac=1,
        random_state=RANDOM_STATE,
        ignore_index=True
)


# --------------------------------------------------------------------------
# Step 4: Train/test split + TF-IDF vectorization
# --------------------------------------------------------------------------

def vectorize_and_split(df: pd.DataFrame):
    """
    Splits the data into train/test sets, then fits a TF-IDF vectorizer
    on the training text only (to avoid data leakage) and transforms
    both sets.
    """
    print("Splitting into train/test sets...")

    X_train_text, X_test_text, y_train, y_test = train_test_split(
        df["clean_content"],
        df["label"],
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=df["label"],
    )

    print("Vectorizing text with TF-IDF...")
    vectorizer = TfidfVectorizer(
        max_features=MAX_TFIDF_FEATURES,
        stop_words="english",
        ngram_range=(1, 2),
    )

    X_train = vectorizer.fit_transform(X_train_text)
    X_test = vectorizer.transform(X_test_text)

    return X_train, X_test, y_train, y_test, vectorizer


# --------------------------------------------------------------------------
# Step 5: Train the classifier
# --------------------------------------------------------------------------

def train_classifier(X_train, y_train) -> LogisticRegression:
    """Trains a Logistic Regression classifier on the TF-IDF features."""
    print("Training Logistic Regression classifier...")

    model = LogisticRegression(
        max_iter=1000,
        random_state=RANDOM_STATE,
        solver="liblinear"
)
    model.fit(X_train, y_train)

    return model


# --------------------------------------------------------------------------
# Step 6: Evaluate
# --------------------------------------------------------------------------

def evaluate_model(model: LogisticRegression, X_test, y_test) -> None:
    """Prints accuracy and a detailed classification report."""
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\nAccuracy: {accuracy:.4f}")

    print("\n" + "=" * 50)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("=" * 50)
    print("\nClassification Report:")
    print(
        classification_report(
            y_test, predictions, target_names=["Fake", "Real"]
        )
    )


# --------------------------------------------------------------------------
# Step 7: Persist model + vectorizer
# --------------------------------------------------------------------------

def save_artifacts(model: LogisticRegression, vectorizer: TfidfVectorizer) -> None:
    """Saves the trained model and TF-IDF vectorizer into the model/ folder."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, MODEL_OUTPUT_PATH)
    joblib.dump(vectorizer, VECTORIZER_OUTPUT_PATH)

    print(f"\nSaved model to:      {MODEL_OUTPUT_PATH}")
    print(f"Saved vectorizer to: {VECTORIZER_OUTPUT_PATH}")


# --------------------------------------------------------------------------
# Main entry point
# --------------------------------------------------------------------------

def main() -> None:
    df = load_datasets(FAKE_CSV_PATH, TRUE_CSV_PATH)
    df = prepare_features(df)
    df = shuffle_dataset(df)

    X_train, X_test, y_train, y_test, vectorizer = vectorize_and_split(df)

    model = train_classifier(X_train, y_train)
    evaluate_model(model, X_test, y_test)

    save_artifacts(model, vectorizer)

    print("\nTraining complete.")


if __name__ == "__main__":
    main()