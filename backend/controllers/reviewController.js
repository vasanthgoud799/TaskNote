import Review from "../models/Review.js";
import FocusSession from "../models/FocusSession.js";
import Habit from "../models/Habit.js";
import NoteRecord from "../models/NoteRecord.js";
import Task from "../models/Task.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeReview = (review) => ({
  id: review._id.toString(),
  type: review.type,
  periodStart: review.periodStart,
  periodEnd: review.periodEnd,
  metrics: review.metrics,
  reflection: review.reflection,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const periodFor = (type) => {
  const now = new Date();
  const start = new Date(now);
  if (type === "monthly") start.setDate(1);
  if (type === "weekly") start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const metricsFor = async (userId, start, end) => {
  const [tasks, notes, habits, sessions] = await Promise.all([
    Task.find({ userId, updatedAt: { $gte: start, $lte: end } }),
    NoteRecord.find({ userId, createdAt: { $gte: start, $lte: end } }),
    Habit.find({ userId }),
    FocusSession.find({ userId, completedAt: { $gte: start, $lte: end } }),
  ]);
  return {
    completedTasks: tasks.filter((task) => task.status === "done").length,
    overdueTasks: await Task.countDocuments({ userId, status: { $ne: "done" }, dueDate: { $lt: start } }),
    notesCreated: notes.length,
    habitsCompleted: habits.reduce((sum, habit) => sum + (habit.completions || []).filter((entry) => {
      const date = new Date(`${typeof entry === "string" ? entry : entry.date}T00:00:00`);
      return date >= start && date <= end;
    }).length, 0),
    focusMinutes: sessions.reduce((sum, session) => sum + (session.minutes || session.durationMinutes || 0), 0),
  };
};

export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.userId }).sort({ periodStart: -1 });
    return sendSuccess(res, 200, "Reviews loaded", { reviews: reviews.map(serializeReview) });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const type = req.body.type || "daily";
    if (!["daily", "weekly", "monthly"].includes(type)) return sendError(res, 400, "Invalid review type");
    const period = req.body.periodStart && req.body.periodEnd
      ? { start: new Date(req.body.periodStart), end: new Date(req.body.periodEnd) }
      : periodFor(type);
    const metrics = req.body.metrics || await metricsFor(req.userId, period.start, period.end);
    const review = await Review.findOneAndUpdate(
      { userId: req.userId, type, periodStart: period.start },
      { $set: { periodEnd: period.end, metrics, reflection: req.body.reflection || "" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return sendSuccess(res, 201, "Review saved", { review: serializeReview(review) });
  } catch (error) {
    next(error);
  }
};
