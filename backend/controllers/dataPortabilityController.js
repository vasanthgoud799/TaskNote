import FocusSession from "../models/FocusSession.js";
import Habit from "../models/Habit.js";
import InboxItem from "../models/InboxItem.js";
import NoteRecord from "../models/NoteRecord.js";
import Project from "../models/Project.js";
import Reminder from "../models/Reminder.js";
import Review from "../models/Review.js";
import Tag from "../models/Tag.js";
import Task from "../models/Task.js";
import Template from "../models/Template.js";
import TimeBlock from "../models/TimeBlock.js";
import UserSettings from "../models/UserSettings.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const collections = {
  notes: NoteRecord,
  tasks: Task,
  habits: Habit,
  tags: Tag,
  projects: Project,
  templates: Template,
  reminders: Reminder,
  focusSessions: FocusSession,
  timeBlocks: TimeBlock,
  reviews: Review,
  inboxItems: InboxItem,
};

const userFieldFor = (key) => (key === "reminders" ? "clerkUserId" : "userId");
const identityFieldFor = (key) => (["habits", "tags", "projects", "templates"].includes(key) ? "name" : "title");

const publicRecord = (record) => {
  const plain = record.toObject ? record.toObject() : { ...record };
  delete plain._id;
  delete plain.__v;
  delete plain.userId;
  delete plain.clerkUserId;
  delete plain.endpoint;
  delete plain.keys;
  return plain;
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const toCsv = (rows, columns) => [
  columns.join(","),
  ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
].join("\n");

export const exportJson = async (req, res, next) => {
  try {
    const data = {};
    for (const [key, Model] of Object.entries(collections)) {
      data[key] = (await Model.find({ [userFieldFor(key)]: req.userId })).map(publicRecord);
    }
    const settings = await UserSettings.findOne({ clerkUserId: req.userId });
    if (settings) data.settings = publicRecord(settings);
    return sendSuccess(res, 200, "Backup exported", {
      exportedAt: new Date().toISOString(),
      version: 1,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const exportTasksCsv = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).lean();
    const csv = toCsv(tasks, ["title", "description", "status", "priority", "dueDate", "estimatedMinutes", "actualMinutes", "createdAt", "updatedAt"]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=tasknote-tasks.csv");
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportNotesMarkdown = async (req, res, next) => {
  try {
    const notes = await NoteRecord.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    const markdown = notes.map((note) => `# ${note.title}\n\n${note.content || ""}\n\n---\n`).join("\n");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=tasknote-notes.md");
    return res.status(200).send(markdown);
  } catch (error) {
    next(error);
  }
};

export const importJson = async (req, res, next) => {
  try {
    const mode = req.body.mode === "skipDuplicates" ? "skipDuplicates" : "merge";
    const backup = req.body.backup;
    if (!backup || typeof backup !== "object") return sendError(res, 400, "Valid backup JSON is required");
    const summary = {};
    for (const [key, Model] of Object.entries(collections)) {
      const rows = Array.isArray(backup[key]) ? backup[key] : [];
      summary[key] = { created: 0, skipped: 0, failed: 0 };
      for (const row of rows) {
        try {
          if (!row || typeof row !== "object") {
            summary[key].failed += 1;
            continue;
          }
          const clean = publicRecord(row);
          const identityField = identityFieldFor(key);
          if (mode === "skipDuplicates" && clean[identityField]) {
            const exists = await Model.exists({ [userFieldFor(key)]: req.userId, [identityField]: clean[identityField] });
            if (exists) {
              summary[key].skipped += 1;
              continue;
            }
          }
          await Model.create({ ...clean, [userFieldFor(key)]: req.userId });
          summary[key].created += 1;
        } catch {
          summary[key].failed += 1;
        }
      }
    }
    if (backup.settings && typeof backup.settings === "object") {
      await UserSettings.findOneAndUpdate(
        { clerkUserId: req.userId },
        { $set: { ...publicRecord(backup.settings), clerkUserId: req.userId } },
        { upsert: true, new: true },
      );
      summary.settings = { created: 1, skipped: 0, failed: 0 };
    }
    return sendSuccess(res, 200, "Backup imported", { summary });
  } catch (error) {
    next(error);
  }
};
