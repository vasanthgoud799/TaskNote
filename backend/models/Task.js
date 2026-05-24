import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "doing", "done", "archived"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    important: { type: Boolean, default: false, index: true },
    urgent: { type: Boolean, default: false, index: true },
    dueDate: { type: Date, default: null, index: true },
    startDate: { type: Date, default: null },
    projectId: { type: String, default: null, index: true },
    tags: { type: [String], default: [] },
    subtasks: { type: [subtaskSchema], default: [] },
    dependencies: { type: [String], default: [] },
    estimatedMinutes: { type: Number, default: 25 },
    actualMinutes: { type: Number, default: 0 },
    energyLevel: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    recurringRule: { type: String, default: "" },
    recurring: {
      frequency: { type: String, enum: ["none", "daily", "weekly", "monthly", "custom"], default: "none" },
      interval: { type: Number, default: 1 },
    },
    reminderAt: { type: Date, default: null },
    reminderOffsets: { type: [Number], default: [] },
    reminderChannels: { type: [String], enum: ["push", "email"], default: [] },
    blockedBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
