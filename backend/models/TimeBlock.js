import mongoose from "mongoose";

const timeBlockSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    taskId: { type: String, default: "", index: true },
    projectId: { type: String, default: "", index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["planned", "completed", "skipped"],
      default: "planned",
      index: true,
    },
    reminderOffsets: { type: [Number], default: [] },
    reminderChannels: { type: [String], enum: ["push", "email"], default: [] },
  },
  { timestamps: true },
);

timeBlockSchema.index({ userId: 1, startAt: 1, endAt: 1 });

export default mongoose.model("TimeBlock", timeBlockSchema);
