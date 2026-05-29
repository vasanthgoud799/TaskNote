import Habit from "../models/Habit.js";
import InboxItem from "../models/InboxItem.js";
import NoteRecord from "../models/NoteRecord.js";
import Project from "../models/Project.js";
import Tag from "../models/Tag.js";
import Task from "../models/Task.js";
import { sendSuccess } from "../utils/respond.js";

const asRegex = (value) => new RegExp(String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
const result = (type, item, extra = {}) => ({
  id: item._id.toString(),
  type,
  title: item.title || item.name,
  content: item.content || item.description || "",
  updatedAt: item.updatedAt,
  ...extra,
});

export const globalSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "all");
    const regex = asRegex(q);
    const wants = (name) => type === "all" || type === name;
    const searches = [];
    if (wants("note")) searches.push(NoteRecord.find({ userId: req.userId, $or: [{ title: regex }, { content: regex }, { tags: regex }] }).limit(20));
    else searches.push(Promise.resolve([]));
    if (wants("task")) searches.push(Task.find({ userId: req.userId, $or: [{ title: regex }, { description: regex }, { tags: regex }] }).limit(20));
    else searches.push(Promise.resolve([]));
    if (wants("habit")) searches.push(Habit.find({ userId: req.userId, name: regex }).limit(20));
    else searches.push(Promise.resolve([]));
    if (wants("tag")) searches.push(Tag.find({ userId: req.userId, name: regex }).limit(20));
    else searches.push(Promise.resolve([]));
    if (wants("project")) searches.push(Project.find({ userId: req.userId, $or: [{ name: regex }, { description: regex }] }).limit(20));
    else searches.push(Promise.resolve([]));
    if (wants("inbox")) searches.push(InboxItem.find({ userId: req.userId, $or: [{ title: regex }, { content: regex }] }).limit(20));
    else searches.push(Promise.resolve([]));

    const [notes, tasks, habits, tags, projects, inbox] = await Promise.all(searches);
    return sendSuccess(res, 200, "Search complete", {
      results: [
        ...notes.map((item) => result("note", item, { route: "/notes" })),
        ...tasks.map((item) => result("task", item, { route: "/tasks", status: item.status, priority: item.priority })),
        ...habits.map((item) => result("habit", item, { route: "/habits" })),
        ...tags.map((item) => result("tag", item, { route: "/tags" })),
        ...projects.map((item) => result("project", item, { route: "/projects" })),
        ...inbox.map((item) => result("inbox", item, { route: "/inbox", status: item.status })),
      ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    });
  } catch (error) {
    next(error);
  }
};
