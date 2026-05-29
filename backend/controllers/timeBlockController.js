import TimeBlock from "../models/TimeBlock.js";
import Task from "../models/Task.js";
import { syncReminderForTarget } from "../services/ReminderSyncService.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeTimeBlock = (block) => ({
  id: block._id.toString(),
  title: block.title,
  taskId: block.taskId,
  projectId: block.projectId,
  startAt: block.startAt,
  endAt: block.endAt,
  status: block.status,
  reminderOffsets: block.reminderOffsets,
  reminderChannels: block.reminderChannels,
  createdAt: block.createdAt,
  updatedAt: block.updatedAt,
});

const findConflict = (userId, startAt, endAt, exceptId = null) => {
  const query = {
    userId,
    status: { $ne: "skipped" },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };
  if (exceptId) query._id = { $ne: exceptId };
  return TimeBlock.findOne(query);
};

const syncBlockReminder = (userId, block) =>
  syncReminderForTarget({
    clerkUserId: userId,
    targetType: "calendar",
    targetId: block._id.toString(),
    title: block.title,
    message: "Your planned time block is about to start.",
    dueAt: block.startAt,
    reminderOffsets: block.reminderOffsets,
    channels: block.reminderChannels,
  });

export const getTimeBlocks = async (req, res, next) => {
  try {
    const blocks = await TimeBlock.find({ userId: req.userId }).sort({ startAt: 1 });
    return sendSuccess(res, 200, "Time blocks loaded", { timeBlocks: blocks.map(serializeTimeBlock) });
  } catch (error) {
    next(error);
  }
};

export const createTimeBlock = async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const startAt = req.body.startAt ? new Date(req.body.startAt) : null;
    const endAt = req.body.endAt ? new Date(req.body.endAt) : null;
    if (!title || !startAt || !endAt || endAt <= startAt) {
      return sendError(res, 400, "Title, start time, and a valid end time are required");
    }
    const conflict = await findConflict(req.userId, startAt, endAt);
    const block = await TimeBlock.create({
      userId: req.userId,
      title,
      taskId: req.body.taskId || "",
      projectId: req.body.projectId || "",
      startAt,
      endAt,
      status: req.body.status || "planned",
      reminderOffsets: Array.isArray(req.body.reminderOffsets) ? req.body.reminderOffsets : [],
      reminderChannels: Array.isArray(req.body.reminderChannels) ? req.body.reminderChannels : [],
    });
    await syncBlockReminder(req.userId, block);
    return sendSuccess(res, 201, conflict ? "Time block saved with an overlap warning" : "Time block saved", {
      timeBlock: serializeTimeBlock(block),
      conflict: Boolean(conflict),
    });
  } catch (error) {
    next(error);
  }
};

export const updateTimeBlock = async (req, res, next) => {
  try {
    const block = await TimeBlock.findOne({ _id: req.params.id, userId: req.userId });
    if (!block) return sendError(res, 404, "Time block not found");
    for (const field of ["title", "taskId", "projectId", "status"]) {
      if (req.body[field] !== undefined) block[field] = req.body[field];
    }
    if (req.body.startAt !== undefined) block.startAt = new Date(req.body.startAt);
    if (req.body.endAt !== undefined) block.endAt = new Date(req.body.endAt);
    if (Array.isArray(req.body.reminderOffsets)) block.reminderOffsets = req.body.reminderOffsets;
    if (Array.isArray(req.body.reminderChannels)) block.reminderChannels = req.body.reminderChannels;
    if (block.endAt <= block.startAt) return sendError(res, 400, "End time must be after start time");
    const conflict = await findConflict(req.userId, block.startAt, block.endAt, block._id);
    await block.save();
    await syncBlockReminder(req.userId, block);
    return sendSuccess(res, 200, conflict ? "Time block updated with an overlap warning" : "Time block updated", {
      timeBlock: serializeTimeBlock(block),
      conflict: Boolean(conflict),
    });
  } catch (error) {
    next(error);
  }
};

export const completeTimeBlock = async (req, res, next) => {
  try {
    const block = await TimeBlock.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { status: "completed" } },
      { new: true },
    );
    if (!block) return sendError(res, 404, "Time block not found");
    if (block.taskId && req.body.completeTask !== false) {
      await Task.findOneAndUpdate({ _id: block.taskId, userId: req.userId }, { $set: { status: "done" } });
    }
    return sendSuccess(res, 200, "Time block completed", { timeBlock: serializeTimeBlock(block) });
  } catch (error) {
    next(error);
  }
};

export const deleteTimeBlock = async (req, res, next) => {
  try {
    const block = await TimeBlock.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!block) return sendError(res, 404, "Time block not found");
    return sendSuccess(res, 200, "Time block deleted");
  } catch (error) {
    next(error);
  }
};
