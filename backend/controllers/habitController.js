import Habit from "../models/Habit.js";
import { cancelRemindersForTarget, syncReminderForTarget } from "../services/ReminderSyncService.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

const currentStreak = (habit) => {
  const completed = new Set(habit.completions.filter((entry) => entry.completed).map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date();
  while (completed.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const serializeHabit = (habit) => ({
  id: habit._id.toString(),
  name: habit.name,
  frequency: habit.frequency,
  color: habit.color,
  reminderAt: habit.reminderAt,
  reminderOffsets: habit.reminderOffsets,
  reminderChannels: habit.reminderChannels,
  streakFreeze: habit.streakFreeze,
  paused: habit.paused,
  archived: habit.archived,
  completions: habit.completions,
  currentStreak: currentStreak(habit),
  completedToday: habit.completions.some((entry) => entry.date === todayKey() && entry.completed),
  createdAt: habit.createdAt,
  updatedAt: habit.updatedAt,
});

const habitReminderDue = (habit) => {
  if (!habit.reminderAt) return null;
  const [hours, minutes] = habit.reminderAt.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const due = new Date();
  due.setHours(hours, minutes, 0, 0);
  if (due < new Date()) due.setDate(due.getDate() + 1);
  return due;
};

const syncHabitReminder = (userId, habit) =>
  syncReminderForTarget({
    clerkUserId: userId,
    targetType: "habit",
    targetId: habit._id.toString(),
    title: habit.name,
    message: `Keep your ${habit.name} streak alive.`,
    dueAt: habitReminderDue(habit),
    reminderOffsets: habit.reminderOffsets,
    channels: habit.reminderChannels,
  });

const assignHabitPatch = (habit, patch) => {
  const allowed = [
    "name",
    "frequency",
    "color",
    "reminderAt",
    "reminderOffsets",
    "reminderChannels",
    "streakFreeze",
    "paused",
    "archived",
    "completions",
  ];
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) habit[field] = patch[field];
  }
};

export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: false }).sort({ updatedAt: -1 });
    return sendSuccess(res, 200, "Habits loaded", { habits: habits.map(serializeHabit) });
  } catch (error) {
    next(error);
  }
};

export const createHabit = async (req, res, next) => {
  try {
    if (!req.body.name?.trim()) return sendError(res, 400, "Habit name is required");
    const habit = await Habit.create({ ...req.body, name: req.body.name.trim(), userId: req.userId });
    await syncHabitReminder(req.userId, habit);
    return sendSuccess(res, 201, "Habit created", { habit: serializeHabit(habit) });
  } catch (error) {
    next(error);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return sendError(res, 404, "Habit not found");
    assignHabitPatch(habit, req.body);
    await habit.save();
    if (habit.archived || habit.paused) {
      await cancelRemindersForTarget(req.userId, "habit", habit._id.toString());
    } else {
      await syncHabitReminder(req.userId, habit);
    }
    return sendSuccess(res, 200, "Habit updated", { habit: serializeHabit(habit) });
  } catch (error) {
    next(error);
  }
};

export const toggleHabitToday = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return sendError(res, 404, "Habit not found");
    const date = todayKey();
    const existing = habit.completions.find((entry) => entry.date === date);
    if (existing) {
      existing.completed = !existing.completed;
    } else {
      habit.completions.push({ date, completed: true });
    }
    await habit.save();
    return sendSuccess(res, 200, "Habit updated", { habit: serializeHabit(habit) });
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { archived: true },
      { new: true }
    );
    if (!habit) return sendError(res, 404, "Habit not found");
    await cancelRemindersForTarget(req.userId, "habit", habit._id.toString());
    return sendSuccess(res, 200, "Habit archived", { habit: serializeHabit(habit) });
  } catch (error) {
    next(error);
  }
};
