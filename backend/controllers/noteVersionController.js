import NoteRecord from "../models/NoteRecord.js";
import NoteVersion from "../models/NoteVersion.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeVersion = (version) => ({
  id: version._id.toString(),
  noteId: version.noteId,
  title: version.title,
  content: version.content,
  category: version.category,
  tags: version.tags,
  color: version.color,
  template: version.template,
  createdAt: version.createdAt,
});

export const getNoteVersions = async (req, res, next) => {
  try {
    const note = await NoteRecord.findOne({ _id: req.params.noteId, userId: req.userId });
    if (!note) return sendError(res, 404, "Note not found");
    const versions = await NoteVersion.find({ userId: req.userId, noteId: req.params.noteId }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, "Note versions loaded", { versions: versions.map(serializeVersion) });
  } catch (error) {
    next(error);
  }
};

export const restoreNoteVersion = async (req, res, next) => {
  try {
    const version = await NoteVersion.findOne({
      _id: req.params.versionId,
      noteId: req.params.noteId,
      userId: req.userId,
    });
    if (!version) return sendError(res, 404, "Note version not found");
    const note = await NoteRecord.findOneAndUpdate(
      { _id: req.params.noteId, userId: req.userId },
      {
        $set: {
          title: version.title,
          content: version.content,
          category: version.category,
          tags: version.tags,
          color: version.color,
          template: version.template,
        },
      },
      { new: true },
    );
    if (!note) return sendError(res, 404, "Note not found");
    return sendSuccess(res, 200, "Note version restored", {
      note: {
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        color: note.color,
        template: note.template,
        pinned: note.pinned,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
