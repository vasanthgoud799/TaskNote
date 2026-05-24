import Task from "../models/Task.js";
import { cancelRemindersForTarget, syncReminderForTarget } from "../services/ReminderSyncService.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeTask = (task) => ({
  id: task._id.toString(),
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  important: task.important,
  urgent: task.urgent,
  dueDate: task.dueDate,
  startDate: task.startDate,
  projectId: task.projectId?.toString() || null,
  tags: task.tags,
  subtasks: task.subtasks,
  dependencies: task.dependencies.map((id) => id.toString()),
  estimatedMinutes: task.estimatedMinutes,
  actualMinutes: task.actualMinutes,
  energyLevel: task.energyLevel,
  recurringRule: task.recurringRule,
  recurring: task.recurring,
  reminderAt: task.reminderAt,
  reminderOffsets: task.reminderOffsets,
  reminderChannels: task.reminderChannels,
  blockedBy: task.blockedBy,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const syncTaskReminder = (userId, task) =>
  syncReminderForTarget({
    clerkUserId: userId,
    targetType: "task",
    targetId: task._id.toString(),
    title: task.title,
    message: task.description,
    dueAt: task.reminderAt || task.dueDate,
    reminderOffsets: task.reminderOffsets,
    channels: task.reminderChannels,
  });

const assignTaskPatch = (task, patch) => {
  const allowed = [
    "title",
    "description",
    "status",
    "priority",
    "important",
    "urgent",
    "dueDate",
    "startDate",
    "projectId",
    "tags",
    "subtasks",
    "dependencies",
    "estimatedMinutes",
    "actualMinutes",
    "energyLevel",
    "recurringRule",
    "recurring",
    "reminderAt",
    "reminderOffsets",
    "reminderChannels",
    "blockedBy",
  ];
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) task[field] = patch[field];
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const query = { userId: req.userId, status: { $ne: "archived" } };
    if (req.query.status) query.status = req.query.status;
    if (req.query.projectId) query.projectId = req.query.projectId;
    const tasks = await Task.find(query).sort({ dueDate: 1, updatedAt: -1 }).limit(Number(req.query.limit || 200));
    return sendSuccess(res, 200, "Tasks loaded", { tasks: tasks.map(serializeTask) });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return sendError(res, 400, "Task title is required");
    const task = await Task.create({ ...req.body, title: title.trim(), userId: req.userId });
    if (task.status !== "done") await syncTaskReminder(req.userId, task);
    return sendSuccess(res, 201, "Task created", { task: serializeTask(task) });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return sendError(res, 404, "Task not found");
    assignTaskPatch(task, req.body);
    if (!task.title?.trim()) return sendError(res, 400, "Task title is required");
    await task.save();
    if (task.status === "done") {
      await cancelRemindersForTarget(req.userId, "task", task._id.toString());
    } else {
      await syncTaskReminder(req.userId, task);
    }
    return sendSuccess(res, 200, "Task updated", { task: serializeTask(task) });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: "archived" },
      { new: true }
    );
    if (!task) return sendError(res, 404, "Task not found");
    await cancelRemindersForTarget(req.userId, "task", task._id.toString());
    return sendSuccess(res, 200, "Task archived", { task: serializeTask(task) });
  } catch (error) {
    next(error);
  }
};
