import DeletedNote from "../models/DeletedNote.js";
import User from "../models/User.js";
import { sendError, sendSuccess } from "../utils/respond.js";
import { serializeDeletedNote, serializeNote } from "../utils/serializers.js";

export const getDeletedNotes = async (req, res, next) => {
  try {
    const deletedNotes = await DeletedNote.find({ userId: req.userId }).sort({ deletedAt: -1 });

    return sendSuccess(res, 200, "Deleted notes loaded", {
      deletedNotes: deletedNotes.map(serializeDeletedNote),
    });
  } catch (error) {
    next(error);
  }
};

export const restoreDeletedNote = async (req, res, next) => {
  try {
    const deletedNote = await DeletedNote.findOne({
      _id: req.params.deletedNoteId,
      userId: req.userId,
    });

    if (!deletedNote) {
      return sendError(res, 404, "Deleted note not found");
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    user.notes.push({
      title: deletedNote.title,
      content: deletedNote.content,
      category: deletedNote.category,
      starred: deletedNote.starred,
      pinned: deletedNote.pinned,
      color: deletedNote.color,
      reminderAt: deletedNote.reminderAt,
      notifyByEmail: deletedNote.notifyByEmail,
      notifyByPhone: deletedNote.notifyByPhone,
      createdAt: deletedNote.originalCreatedAt,
      updatedAt: deletedNote.originalUpdatedAt,
    });

    await user.save();
    const restoredNote = user.notes[user.notes.length - 1];
    await deletedNote.deleteOne();

    return sendSuccess(res, 200, "Note restored", { note: serializeNote(restoredNote) });
  } catch (error) {
    next(error);
  }
};

export const permanentlyDeleteNote = async (req, res, next) => {
  try {
    const deletedNote = await DeletedNote.findOneAndDelete({
      _id: req.params.deletedNoteId,
      userId: req.userId,
    });

    if (!deletedNote) {
      return sendError(res, 404, "Deleted note not found");
    }

    return sendSuccess(res, 200, "Note permanently deleted", {
      deletedNote: serializeDeletedNote(deletedNote),
    });
  } catch (error) {
    next(error);
  }
};

export const emptyTrash = async (req, res, next) => {
  try {
    const result = await DeletedNote.deleteMany({ userId: req.userId });

    return sendSuccess(res, 200, "Trash emptied", {
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
