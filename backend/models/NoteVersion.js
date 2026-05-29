import mongoose from "mongoose";

const noteVersionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    noteId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    category: { type: String, default: "Personal" },
    tags: { type: [String], default: [] },
    color: { type: String, default: "#141414" },
    template: { type: String, default: "" },
  },
  { timestamps: true },
);

noteVersionSchema.index({ userId: 1, noteId: 1, createdAt: -1 });

export default mongoose.model("NoteVersion", noteVersionSchema);
