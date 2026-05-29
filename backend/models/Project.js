import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "folder",
    },
    color: {
      type: String,
      default: "sky",
    },
    parentProjectId: {
      type: String,
      default: "",
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
