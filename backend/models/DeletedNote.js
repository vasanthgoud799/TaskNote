import mongoose from "mongoose";

const deletedNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  originalNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
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
  originalCreatedAt: {
    type: Date,
    required: true,
  },
  originalUpdatedAt: {
    type: Date,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
});

const DeletedNote = mongoose.model("DeletedNote", deletedNoteSchema);

export default DeletedNote;
