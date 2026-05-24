import FocusSession from "../models/FocusSession.js";
import Task from "../models/Task.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const dayKey = (date) => date.toISOString().slice(0, 10);

const serializeSession = (session) => ({
  id: session._id.toString(),
  taskId: session.taskId?.toString() || null,
  durationMinutes: session.durationMinutes,
  minutes: session.durationMinutes,
  preset: session.preset,
  completedAt: session.completedAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

const summarizeSessions = (sessions) => {
  const today = dayKey(new Date());
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dayKey(date);
    const minutes = sessions
      .filter((session) => dayKey(new Date(session.completedAt)) === key)
      .reduce((sum, session) => sum + session.durationMinutes, 0);
    return { date: key, label: date.toLocaleDateString("en", { weekday: "short" }), minutes };
  });

  return {
    todayMinutes: sessions
      .filter((session) => dayKey(new Date(session.completedAt)) === today)
      .reduce((sum, session) => sum + session.durationMinutes, 0),
    weekMinutes: sessions
      .filter((session) => new Date(session.completedAt) >= weekStart)
      .reduce((sum, session) => sum + session.durationMinutes, 0),
    sessionCount: sessions.length,
    last7Days,
  };
};

export const getFocusSessions = async (req, res, next) => {
  try {
    const sessions = await FocusSession.find({ userId: req.userId })
      .sort({ completedAt: -1 })
      .limit(Number(req.query.limit || 200));

    return sendSuccess(res, 200, "Focus sessions loaded", {
      sessions: sessions.map(serializeSession),
      stats: summarizeSessions(sessions),
    });
  } catch (error) {
    next(error);
  }
};

export const createFocusSession = async (req, res, next) => {
  try {
    const durationMinutes = Math.round(Number(req.body.durationMinutes || 0));
    if (durationMinutes < 1) return sendError(res, 400, "Focus duration must be at least 1 minute");

    const taskId = req.body.taskId || null;
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, userId: req.userId });
      if (!task) return sendError(res, 404, "Task not found");
      task.actualMinutes = (task.actualMinutes || 0) + durationMinutes;
      await task.save();
    }

    const session = await FocusSession.create({
      userId: req.userId,
      taskId,
      durationMinutes,
      minutes: durationMinutes,
      preset: req.body.preset || "pomodoro",
      completedAt: req.body.completedAt ? new Date(req.body.completedAt) : new Date(),
    });

    const sessions = await FocusSession.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(200);
    return sendSuccess(res, 201, "Focus session saved", {
      session: serializeSession(session),
      stats: summarizeSessions(sessions),
    });
  } catch (error) {
    next(error);
  }
};
