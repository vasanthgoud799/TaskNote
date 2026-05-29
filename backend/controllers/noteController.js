import NoteRecord from "../models/NoteRecord.js";
import NoteVersion from "../models/NoteVersion.js";
import { cancelRemindersForTarget, syncReminderForTarget } from "../services/ReminderSyncService.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeNote = (note) => ({
  id: note._id.toString(),
  title: note.title,
  content: note.content,
  category: note.category,
  starred: note.starred,
  pinned: note.pinned,
  color: note.color,
  tags: note.tags || [],
  backlinks: note.backlinks || [],
  linkedTaskIds: note.linkedTaskIds || [],
  template: note.template || "",
  reminderAt: note.reminderAt,
  notifyByEmail: note.notifyByEmail,
  notifyByPhone: note.notifyByPhone,
  reminderOffsets: note.reminderOffsets,
  reminderChannels: note.reminderChannels,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const syncNoteReminder = (userId, note) =>
  syncReminderForTarget({
    clerkUserId: userId,
    targetType: "note",
    targetId: note._id.toString(),
    title: note.title,
    message: note.content,
    dueAt: note.reminderAt,
    reminderOffsets: note.reminderOffsets,
    channels: note.reminderChannels,
  });

export const getNotes = async (req, res, next) => {
  try {
    const notes = await NoteRecord.find({ userId: req.userId }).sort({ pinned: -1, updatedAt: -1 });
    return sendSuccess(res, 200, "Notes loaded", { notes: notes.map(serializeNote) });
  } catch (error) {
    next(error);
  }
};

export const getNoteGraph = async (req, res, next) => {
  try {
    const notes = await NoteRecord.find({ userId: req.userId }).select("title content backlinks updatedAt").lean();
    const titleToId = new Map(notes.map((note) => [note.title.trim().toLowerCase(), note._id.toString()]));
    const nodes = notes.map((note) => ({
      id: note._id.toString(),
      title: note.title,
      updatedAt: note.updatedAt,
    }));
    const edges = [];
    for (const note of notes) {
      const source = note._id.toString();
      const backlinks = Array.isArray(note.backlinks) ? note.backlinks : [];
      const inlineLinks = [...String(note.content || "").matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1].trim());
      for (const rawTitle of new Set([...backlinks, ...inlineLinks])) {
        const target = titleToId.get(rawTitle.toLowerCase());
        if (target && target !== source) {
          edges.push({ id: `${source}-${target}`, source, target, label: rawTitle });
        }
      }
    }
    return sendSuccess(res, 200, "Knowledge graph loaded", { nodes, edges });
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    const note = await NoteRecord.findOne({ _id: req.params.noteId, userId: req.userId });
    if (!note) return sendError(res, 404, "Note not found");
    return sendSuccess(res, 200, "Note loaded", { note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return sendError(res, 400, "Title is required");
    const note = await NoteRecord.create({
      userId: req.userId,
      title,
      content: req.body.content?.trim() || "",
      category: req.body.category?.trim() || "Personal",
      starred: Boolean(req.body.starred),
      pinned: Boolean(req.body.pinned),
      color: req.body.color || "#141414",
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      backlinks: Array.isArray(req.body.backlinks) ? req.body.backlinks : [],
      linkedTaskIds: Array.isArray(req.body.linkedTaskIds) ? req.body.linkedTaskIds : [],
      template: req.body.template || "",
      reminderAt: req.body.reminderAt ? new Date(req.body.reminderAt) : null,
      notifyByEmail: Boolean(req.body.notifyByEmail),
      notifyByPhone: Boolean(req.body.notifyByPhone),
      reminderOffsets: Array.isArray(req.body.reminderOffsets) ? req.body.reminderOffsets : [],
      reminderChannels: Array.isArray(req.body.reminderChannels) ? req.body.reminderChannels : [],
    });
    await syncNoteReminder(req.userId, note);
    return sendSuccess(res, 201, "Note created", { note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const note = await NoteRecord.findOne({ _id: req.params.noteId, userId: req.userId });
    if (!note) return sendError(res, 404, "Note not found");
    const previous = {
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      color: note.color,
      template: note.template || "",
    };
    if (req.body.title !== undefined) {
      const title = req.body.title.trim();
      if (!title) return sendError(res, 400, "Title is required");
      note.title = title;
    }
    for (const field of ["content", "category", "color", "template"]) {
      if (req.body[field] !== undefined) note[field] = req.body[field];
    }
    for (const field of ["starred", "pinned", "notifyByEmail", "notifyByPhone"]) {
      if (req.body[field] !== undefined) note[field] = Boolean(req.body[field]);
    }
    if (Array.isArray(req.body.tags)) note.tags = req.body.tags;
    if (Array.isArray(req.body.backlinks)) note.backlinks = req.body.backlinks;
    if (Array.isArray(req.body.linkedTaskIds)) note.linkedTaskIds = req.body.linkedTaskIds;
    if (Array.isArray(req.body.reminderOffsets)) note.reminderOffsets = req.body.reminderOffsets;
    if (Array.isArray(req.body.reminderChannels)) note.reminderChannels = req.body.reminderChannels;
    if (req.body.reminderAt !== undefined) note.reminderAt = req.body.reminderAt ? new Date(req.body.reminderAt) : null;
    const changed =
      previous.title !== note.title ||
      previous.content !== note.content ||
      previous.category !== note.category ||
      previous.color !== note.color ||
      previous.template !== note.template ||
      JSON.stringify(previous.tags) !== JSON.stringify(note.tags || []);
    if (changed) {
      await NoteVersion.create({
        userId: req.userId,
        noteId: note._id.toString(),
        ...previous,
      });
    }
    await note.save();
    await syncNoteReminder(req.userId, note);
    return sendSuccess(res, 200, "Note updated", { note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};

export const toggleStarred = async (req, res, next) => {
  try {
    const note = await NoteRecord.findOne({ _id: req.params.noteId, userId: req.userId });
    if (!note) return sendError(res, 404, "Note not found");
    note.starred = req.body.starred === undefined ? !note.starred : Boolean(req.body.starred);
    await note.save();
    return sendSuccess(res, 200, note.starred ? "Note starred" : "Note unstarred", { note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await NoteRecord.findOneAndDelete({ _id: req.params.noteId, userId: req.userId });
    if (!note) return sendError(res, 404, "Note not found");
    await cancelRemindersForTarget(req.userId, "note", note._id.toString());
    return sendSuccess(res, 200, "Note deleted", { note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};
