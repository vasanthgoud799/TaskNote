import Habit from "../models/Habit.js";
import InboxItem from "../models/InboxItem.js";
import NoteRecord from "../models/NoteRecord.js";
import Task from "../models/Task.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeInboxItem = (item) => ({
  id: item._id.toString(),
  title: item.title,
  content: item.content,
  typeSuggestion: item.typeSuggestion,
  source: item.source,
  status: item.status,
  convertedTo: item.convertedTo,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const serializeCreated = (record) => ({
  id: record._id.toString(),
  title: record.title || record.name,
  name: record.name,
  content: record.content,
  description: record.description,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export const getInboxItems = async (req, res, next) => {
  try {
    const items = await InboxItem.find({ userId: req.userId, status: { $ne: "archived" } }).sort({
      createdAt: -1,
    });
    return sendSuccess(res, 200, "Inbox loaded", { inboxItems: items.map(serializeInboxItem) });
  } catch (error) {
    next(error);
  }
};

export const createInboxItem = async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return sendError(res, 400, "Capture title is required");
    const item = await InboxItem.create({
      userId: req.userId,
      title,
      content: req.body.content?.trim() || "",
      typeSuggestion: req.body.typeSuggestion || "idea",
      source: req.body.source || "quick-capture",
    });
    return sendSuccess(res, 201, "Captured to inbox", { inboxItem: serializeInboxItem(item) });
  } catch (error) {
    next(error);
  }
};

export const updateInboxItem = async (req, res, next) => {
  try {
    const patch = {};
    for (const field of ["title", "content", "typeSuggestion", "source", "status"]) {
      if (req.body[field] !== undefined) patch[field] = req.body[field];
    }
    const item = await InboxItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: patch },
      { new: true },
    );
    if (!item) return sendError(res, 404, "Inbox item not found");
    return sendSuccess(res, 200, "Inbox item updated", { inboxItem: serializeInboxItem(item) });
  } catch (error) {
    next(error);
  }
};

export const deleteInboxItem = async (req, res, next) => {
  try {
    const item = await InboxItem.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return sendError(res, 404, "Inbox item not found");
    return sendSuccess(res, 200, "Inbox item deleted");
  } catch (error) {
    next(error);
  }
};

const markProcessed = async (item, type, record) => {
  item.status = "processed";
  item.convertedTo = { type, id: record._id.toString() };
  await item.save();
};

export const convertInboxToNote = async (req, res, next) => {
  try {
    const item = await InboxItem.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return sendError(res, 404, "Inbox item not found");
    const note = await NoteRecord.create({
      userId: req.userId,
      title: req.body.title?.trim() || item.title,
      content: req.body.content ?? item.content,
      pinned: Boolean(req.body.pinned),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    });
    await markProcessed(item, "note", note);
    return sendSuccess(res, 201, "Inbox item converted to note", {
      inboxItem: serializeInboxItem(item),
      note: serializeCreated(note),
    });
  } catch (error) {
    next(error);
  }
};

export const convertInboxToTask = async (req, res, next) => {
  try {
    const item = await InboxItem.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return sendError(res, 404, "Inbox item not found");
    const task = await Task.create({
      userId: req.userId,
      title: req.body.title?.trim() || item.title,
      description: req.body.description ?? item.content,
      status: req.body.status || "todo",
      priority: req.body.priority || "medium",
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      important: Boolean(req.body.important),
      urgent: Boolean(req.body.urgent || req.body.priority === "urgent"),
    });
    await markProcessed(item, "task", task);
    return sendSuccess(res, 201, "Inbox item converted to task", {
      inboxItem: serializeInboxItem(item),
      task: serializeCreated(task),
    });
  } catch (error) {
    next(error);
  }
};

export const convertInboxToHabit = async (req, res, next) => {
  try {
    const item = await InboxItem.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return sendError(res, 404, "Inbox item not found");
    const habit = await Habit.create({
      userId: req.userId,
      name: req.body.name?.trim() || item.title,
      color: req.body.color || "#e6b957",
      frequency: req.body.frequency || "daily",
    });
    await markProcessed(item, "habit", habit);
    return sendSuccess(res, 201, "Inbox item converted to habit", {
      inboxItem: serializeInboxItem(item),
      habit: serializeCreated(habit),
    });
  } catch (error) {
    next(error);
  }
};
