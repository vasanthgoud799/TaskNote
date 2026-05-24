import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
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
    color: {
      type: String,
      default: "#d8a23a",
    },
  },
  { timestamps: true }
);

tagSchema.index({ userId: 1, name: 1 }, { unique: true });

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
