import mongoose from "mongoose";

const noteRecordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    category: { type: String, default: "Personal", trim: true, index: true },
    starred: { type: Boolean, default: false, index: true },
    pinned: { type: Boolean, default: false, index: true },
    color: { type: String, default: "#141414", trim: true },
    tags: { type: [String], default: [] },
    backlinks: { type: [String], default: [] },
    linkedTaskIds: { type: [String], default: [] },
    template: { type: String, default: "" },
    reminderAt: { type: Date, default: null },
    notifyByEmail: { type: Boolean, default: false },
    notifyByPhone: { type: Boolean, default: false },
    reminderOffsets: { type: [Number], default: [] },
    reminderChannels: { type: [String], enum: ["push", "email"], default: [] },
  },
  { timestamps: true }
);

const NoteRecord = mongoose.model("NoteRecord", noteRecordSchema);

export default NoteRecord;
