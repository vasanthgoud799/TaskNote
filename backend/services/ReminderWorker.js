import Reminder from "../models/Reminder.js";
import { notificationService } from "./NotificationService.js";

const maxAttempts = Number(process.env.REMINDER_MAX_ATTEMPTS || 3);

const dueOffsetsForReminder = (reminder, now) =>
  [...new Set([...(reminder.reminderOffsets || []), 0])]
    .map((offset) => Number(offset))
    .filter((offset) => !reminder.sentOffsets.includes(offset))
    .filter((offset) => new Date(reminder.dueAt).getTime() - offset * 60_000 <= now.getTime())
    .sort((a, b) => b - a);

export const processDueReminders = async () => {
  const now = new Date();
  const dueReminders = await Reminder.find({
    status: { $in: ["pending", "failed"] },
    dueAt: { $lte: new Date(now.getTime() + 24 * 60 * 60_000) },
    attempts: { $lt: maxAttempts },
  }).limit(20);

  for (const reminder of dueReminders) {
    const offsets = dueOffsetsForReminder(reminder, now);
    if (!offsets.length) continue;

    try {
      const locked = await Reminder.findOneAndUpdate(
        { _id: reminder._id, status: { $in: ["pending", "failed"] }, attempts: { $lt: maxAttempts } },
        { $set: { status: "sending", lockedAt: new Date() }, $inc: { attempts: 1 } },
        { new: true }
      );
      if (!locked) continue;

      for (const offset of offsets) {
        await notificationService.sendReminder(locked, offset);
        locked.sentOffsets = [...new Set([...locked.sentOffsets, offset])];
      }

      const allOffsets = [...new Set([...(locked.reminderOffsets || []), 0])];
      locked.status = allOffsets.every((offset) => locked.sentOffsets.includes(offset)) ? "sent" : "pending";
      locked.sentAt = locked.status === "sent" ? new Date() : locked.sentAt;
      locked.lastError = "";
      locked.lockedAt = null;
      await locked.save();
    } catch (error) {
      await Reminder.findByIdAndUpdate(reminder._id, {
        $set: {
          status: reminder.attempts + 1 >= maxAttempts ? "failed" : "pending",
          lastError: error.message,
          lockedAt: null,
        },
      });
    }
  }
};

export const startReminderWorker = () => {
  if (process.env.DISABLE_REMINDER_WORKER === "true") {
    return;
  }

  const intervalMs = Number(process.env.REMINDER_WORKER_INTERVAL_MS || 60_000);
  setInterval(() => {
    processDueReminders().catch((error) => {
      console.error("Reminder worker failed:", error.message);
    });
  }, intervalMs);
};
