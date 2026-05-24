import Reminder from "../models/Reminder.js";

const validChannels = (channels = []) => channels.filter((channel) => ["push", "email"].includes(channel));
const validOffsets = (offsets = []) =>
  [...new Set(offsets.map((offset) => Number(offset)).filter((offset) => Number.isFinite(offset) && offset >= 0))]
    .sort((a, b) => b - a);

export const syncReminderForTarget = async ({
  clerkUserId,
  targetType,
  targetId,
  title,
  message = "",
  dueAt,
  reminderOffsets = [30, 5, 1],
  channels = ["push"],
}) => {
  const parsedDue = dueAt ? new Date(dueAt) : null;
  const normalizedChannels = validChannels(channels);

  if (!parsedDue || Number.isNaN(parsedDue.getTime()) || !normalizedChannels.length) {
    await cancelRemindersForTarget(clerkUserId, targetType, targetId);
    return null;
  }

  return Reminder.findOneAndUpdate(
    { clerkUserId, targetType, targetId, status: { $ne: "cancelled" } },
    {
      $set: {
        title,
        message: message.slice(0, 500),
        dueAt: parsedDue,
        reminderOffsets: validOffsets(reminderOffsets),
        channels: normalizedChannels,
        status: "pending",
        sentOffsets: [],
        attempts: 0,
        lastError: "",
        lockedAt: null,
      },
    },
    { new: true, upsert: true }
  );
};

export const cancelRemindersForTarget = (clerkUserId, targetType, targetId) =>
  Reminder.updateMany(
    { clerkUserId, targetType, targetId, status: { $in: ["pending", "failed", "sending"] } },
    { $set: { status: "cancelled", lockedAt: null } }
  );
