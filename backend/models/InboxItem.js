import mongoose from "mongoose";

const inboxItemSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    typeSuggestion: {
      type: String,
      enum: ["idea", "note", "task", "habit", "reminder"],
      default: "idea",
      index: true,
    },
    source: { type: String, default: "quick-capture", trim: true },
    status: {
      type: String,
      enum: ["unprocessed", "processed", "archived"],
      default: "unprocessed",
      index: true,
    },
    convertedTo: {
      type: { type: String, default: "" },
      id: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

inboxItemSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export default mongoose.model("InboxItem", inboxItemSchema);
