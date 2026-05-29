import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    reflection: { type: String, default: "" },
  },
  { timestamps: true },
);

reviewSchema.index({ userId: 1, type: 1, periodStart: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
