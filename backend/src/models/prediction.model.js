import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Prediction
 *
 * Stores a single fake-news-detection result, tied to the user who
 * requested it, so it can be listed back as that user's scan history.
 */
const predictionSchema = new Schema(
  {
    // Reference to the User who ran this prediction. Assumes your User
    // model is registered as "User" — update the `ref` value below if
    // it's registered under a different name in your project.
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A prediction must belong to a user."],
      index: true,
    },

    // The original article text that was analyzed.
    text: {
    type: String,
        required: [true, "Prediction text is required."],
        trim: true,
        minlength: [10, "Prediction text is too short."],
        maxlength: [10000, "Prediction text is too long."],
    },

    // The model's verdict. Constrained to exactly these two values so
    // bad data can't silently end up in the collection.
    prediction: {
      type: String,
      required: [true, "Prediction label is required."],
      enum: {
        values: ["Fake", "Real"],
        message: '{VALUE} is not a valid prediction label. Must be "Fake" or "Real".',
      },
    },

    // Model confidence for the predicted label, stored as a 0–1
    // decimal (e.g. 0.91), matching the { prediction, confidence }
    // shape already used elsewhere in this project. Adjust min/max to
    // 0–100 here if your API instead returns a percentage.
    confidence: {
      type: Number,
      required: [true, "Confidence score is required."],
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// The primary access pattern is "this user's predictions, newest first"
// (getPredictionHistory), so index user + createdAt together for fast,
// efficient sorted lookups per user.
predictionSchema.index({ user: 1, createdAt: -1 });

const Prediction = model("Prediction", predictionSchema);

export default Prediction;