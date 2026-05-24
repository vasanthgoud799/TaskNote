import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      default: null,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    minutes: {
      type: Number,
      default: undefined,
    },
    preset: {
      type: String,
      enum: ["pomodoro", "deep", "quick", "custom"],
      default: "pomodoro",
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

const FocusSession = mongoose.model("FocusSession", focusSessionSchema);

export default FocusSession;
