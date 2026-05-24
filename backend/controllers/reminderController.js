import Reminder from "../models/Reminder.js";
import UserSettings from "../models/UserSettings.js";
import { notificationService } from "../services/NotificationService.js";
import { cancelRemindersForTarget, syncReminderForTarget } from "../services/ReminderSyncService.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeReminder = (reminder) => ({
  id: reminder._id.toString(),
  targetType: reminder.targetType,
  targetId: reminder.targetId,
  title: reminder.title,
  message: reminder.message,
  dueAt: reminder.dueAt,
  reminderOffsets: reminder.reminderOffsets,
  channels: reminder.channels,
  sentOffsets: reminder.sentOffsets,
  status: reminder.status,
  attempts: reminder.attempts,
  lastError: reminder.lastError,
  sentAt: reminder.sentAt,
  createdAt: reminder.createdAt,
  updatedAt: reminder.updatedAt,
});

const getSettings = (req) =>
  UserSettings.findOneAndUpdate(
    { clerkUserId: req.userId },
    {
      $setOnInsert: {
        email: req.body?.email || "",
        name: req.body?.name || "",
      },
    },
    { new: true, upsert: true }
  );

export const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ clerkUserId: req.userId, status: { $ne: "cancelled" } }).sort({
      dueAt: 1,
    });
    return sendSuccess(res, 200, "Reminders loaded", { reminders: reminders.map(serializeReminder) });
  } catch (error) {
    next(error);
  }
};

export const createReminder = async (req, res, next) => {
  try {
    const { targetType, targetId, title, dueAt } = req.body;
    if (!targetType || !targetId || !title?.trim() || !dueAt) {
      return sendError(res, 400, "Reminder target, title, and due time are required");
    }

    const reminder = await syncReminderForTarget({
      clerkUserId: req.userId,
      targetType,
      targetId,
      title: title.trim(),
      message: req.body.message || "",
      dueAt,
      reminderOffsets: req.body.reminderOffsets,
      channels: req.body.channels,
    });

    return sendSuccess(res, 201, "Reminder saved", { reminder: serializeReminder(reminder) });
  } catch (error) {
    next(error);
  }
};

export const updateReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, clerkUserId: req.userId });
    if (!reminder) return sendError(res, 404, "Reminder not found");

    const updated = await syncReminderForTarget({
      clerkUserId: req.userId,
      targetType: reminder.targetType,
      targetId: reminder.targetId,
      title: req.body.title || reminder.title,
      message: req.body.message ?? reminder.message,
      dueAt: req.body.dueAt || reminder.dueAt,
      reminderOffsets: req.body.reminderOffsets || reminder.reminderOffsets,
      channels: req.body.channels || reminder.channels,
    });

    return sendSuccess(res, 200, "Reminder updated", { reminder: serializeReminder(updated) });
  } catch (error) {
    next(error);
  }
};

export const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, clerkUserId: req.userId },
      { $set: { status: "cancelled", lockedAt: null } },
      { new: true }
    );
    if (!reminder) return sendError(res, 404, "Reminder not found");
    return sendSuccess(res, 200, "Reminder cancelled", { reminder: serializeReminder(reminder) });
  } catch (error) {
    next(error);
  }
};

export const snoozeReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, clerkUserId: req.userId });
    if (!reminder) return sendError(res, 404, "Reminder not found");
    const minutes = Number(req.body.minutes || 10);
    reminder.dueAt = new Date(Date.now() + minutes * 60_000);
    reminder.status = "pending";
    reminder.sentOffsets = [];
    reminder.attempts = 0;
    reminder.lastError = "";
    await reminder.save();
    return sendSuccess(res, 200, "Reminder snoozed", { reminder: serializeReminder(reminder) });
  } catch (error) {
    next(error);
  }
};

export const cancelTargetReminders = async (req, res, next) => {
  try {
    await cancelRemindersForTarget(req.userId, req.body.targetType, req.body.targetId);
    return sendSuccess(res, 200, "Target reminders cancelled");
  } catch (error) {
    next(error);
  }
};

export const testEmail = async (req, res, next) => {
  try {
    const settings = await getSettings(req);
    if (!settings.emailReminders) return sendError(res, 400, "Email reminders are disabled");
    await notificationService.sendTest(settings, "email", req.userId);
    return sendSuccess(res, 200, "Test email sent");
  } catch (error) {
    next(error);
  }
};

export const testPush = async (req, res, next) => {
  try {
    const settings = await getSettings(req);
    if (!settings.pushReminders) return sendError(res, 400, "Push reminders are disabled");
    await notificationService.sendTest(settings, "push", req.userId);
    return sendSuccess(res, 200, "Test push sent");
  } catch (error) {
    next(error);
  }
};
