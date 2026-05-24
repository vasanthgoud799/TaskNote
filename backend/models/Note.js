import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Personal",
      trim: true,
    },
    starred: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "sky",
      trim: true,
    },
    reminderAt: {
      type: Date,
      default: null,
    },
    notifyByEmail: {
      type: Boolean,
      default: false,
    },
    notifyByPhone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default noteSchema;
