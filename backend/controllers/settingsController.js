import UserSettings from "../models/UserSettings.js";
import { sendSuccess } from "../utils/respond.js";

const serializeSettings = (settings) => ({
  email: settings.email,
  name: settings.name,
  emailReminders: settings.emailReminders,
  pushReminders: settings.pushReminders,
  defaultReminderOffsets: settings.defaultReminderOffsets,
  defaultReminderChannels: settings.defaultReminderChannels,
  quietHours: settings.quietHours,
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  pushConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT),
  emailConfigured: Boolean(process.env.EMAIL_PROVIDER !== "smtp" || (process.env.SMTP_HOST && process.env.SMTP_FROM)),
});

const upsertSettings = (req, patch = {}) =>
  UserSettings.findOneAndUpdate(
    { clerkUserId: req.userId },
    { $set: patch, $setOnInsert: { clerkUserId: req.userId } },
    { new: true, upsert: true }
  );

export const getSettings = async (req, res, next) => {
  try {
    const settings = await upsertSettings(req);
    return sendSuccess(res, 200, "Settings loaded", { settings: serializeSettings(settings) });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      "email",
      "name",
      "emailReminders",
      "pushReminders",
      "defaultReminderOffsets",
      "defaultReminderChannels",
      "quietHours",
    ];
    const patch = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) patch[field] = req.body[field];
    }
    const settings = await upsertSettings(req, patch);
    return sendSuccess(res, 200, "Settings saved", { settings: serializeSettings(settings) });
  } catch (error) {
    next(error);
  }
};
