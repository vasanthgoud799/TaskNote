import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    completed: { type: Boolean, default: true },
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "custom"],
      default: "daily",
    },
    color: {
      type: String,
      default: "emerald",
    },
    reminderAt: {
      type: String,
      default: "",
    },
    reminderOffsets: { type: [Number], default: [] },
    reminderChannels: { type: [String], enum: ["push", "email"], default: [] },
    streakFreeze: { type: Number, default: 0 },
    paused: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    completions: {
      type: [habitLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Habit = mongoose.model("Habit", habitSchema);

export default Habit;
