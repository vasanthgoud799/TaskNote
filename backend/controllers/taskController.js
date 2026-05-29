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

const nextDueDate = (task) => {
  const rule = task.recurringRule || task.recurring?.frequency;
  if (!rule || rule === "none" || !task.dueDate) return null;
  const next = new Date(task.dueDate);
  const interval = Number(task.recurring?.interval || 1);
  if (rule === "daily") next.setDate(next.getDate() + interval);
  if (rule === "weekdays") {
    do {
      next.setDate(next.getDate() + 1);
    } while ([0, 6].includes(next.getDay()));
  }
  if (rule === "weekly") next.setDate(next.getDate() + 7 * interval);
  if (rule === "monthly") next.setMonth(next.getMonth() + interval);
  if (task.recurring?.endDate && next > new Date(task.recurring.endDate)) return null;
  return next;
};

const wouldCreateCircularDependency = async (userId, taskId, dependencies = []) => {
  const target = taskId?.toString();
  if (!target || !dependencies.includes(target)) {
    const seen = new Set();
    const visit = async (id) => {
      if (!id || seen.has(id)) return false;
      if (id === target) return true;
      seen.add(id);
      const task = await Task.findOne({ _id: id, userId }).select("dependencies");
      if (!task) return false;
      for (const dep of task.dependencies || []) {
        if (await visit(dep.toString())) return true;
      }
      return false;
    };
    for (const dep of dependencies) {
      if (await visit(dep.toString())) return true;
    }
    return false;
  }
  return true;
};

const createNextRecurringTask = async (task) => {
  const dueDate = nextDueDate(task);
  if (!dueDate) return null;
  const exists = await Task.findOne({
    userId: task.userId,
    title: task.title,
    dueDate,
    recurringRule: task.recurringRule,
    status: { $ne: "archived" },
  });
  if (exists) return exists;
  const clone = await Task.create({
    userId: task.userId,
    title: task.title,
    description: task.description,
    status: "todo",
    priority: task.priority,
    important: task.important,
    urgent: task.urgent,
    dueDate,
    startDate: task.startDate,
    projectId: task.projectId,
    tags: task.tags,
    subtasks: (task.subtasks || []).map((item) => ({ title: item.title, done: false })),
    dependencies: task.dependencies,
    estimatedMinutes: task.estimatedMinutes,
    energyLevel: task.energyLevel,
    recurringRule: task.recurringRule,
    recurring: { ...(task.recurring || {}), nextRunAt: dueDate, enabled: true },
    reminderOffsets: task.reminderOffsets,
    reminderChannels: task.reminderChannels,
  });
  await syncTaskReminder(task.userId, clone);
  return clone;
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
    if (Array.isArray(req.body.dependencies) && req.body.dependencies.length) {
      const invalid = await Promise.all(req.body.dependencies.map((id) => Task.exists({ _id: id, userId: req.userId })));
      if (invalid.some((value) => !value)) return sendError(res, 400, "One or more dependency tasks were not found");
    }
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
    if (Array.isArray(task.dependencies) && await wouldCreateCircularDependency(req.userId, task._id, task.dependencies)) {
      return sendError(res, 400, "Circular task dependencies are not allowed");
    }
    await task.save();
    if (task.status === "done") {
      await cancelRemindersForTarget(req.userId, "task", task._id.toString());
      await createNextRecurringTask(task);
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
