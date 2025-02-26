import { Schema, model } from "mongoose";

const DeletedNoteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String },
  deletedAt: { type: Date, default: Date.now },
});

export default model("DeletedNote", DeletedNoteSchema);
