import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["task", "note", "habit", "calendar", "focus"],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    reminderOffsets: {
      type: [Number],
      default: [30, 5, 1],
    },
    channels: {
      type: [String],
      enum: ["push", "email"],
      default: ["push"],
    },
    sentOffsets: {
      type: [Number],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: "",
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reminderSchema.index({ clerkUserId: 1, targetType: 1, targetId: 1 });
reminderSchema.index({ status: 1, dueAt: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
