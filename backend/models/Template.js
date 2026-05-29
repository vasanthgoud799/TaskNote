import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["note", "task", "project", "review"],
      required: true,
      index: true,
    },
    body: { type: String, default: "" },
    defaults: { type: mongoose.Schema.Types.Mixed, default: {} },
    isBuiltIn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

templateSchema.index({ userId: 1, type: 1, name: 1 });

export default mongoose.model("Template", templateSchema);
