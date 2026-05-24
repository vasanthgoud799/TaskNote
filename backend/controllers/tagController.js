import Tag from "../models/Tag.js";
import Task from "../models/Task.js";
import NoteRecord from "../models/NoteRecord.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const normalizeTagName = (name) => name?.trim().replace(/\s+/g, " ");

const tagUsage = async (userId, name) => {
  const [noteCount, taskCount] = await Promise.all([
    NoteRecord.countDocuments({ userId, $or: [{ tags: name }, { category: name }] }),
    Task.countDocuments({ userId, status: { $ne: "archived" }, tags: name }),
  ]);
  return { noteCount, taskCount };
};

const serializeTag = async (tag) => ({
  id: tag._id.toString(),
  name: tag.name,
  color: tag.color,
  ...(await tagUsage(tag.userId, tag.name)),
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

export const getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find({ userId: req.userId }).sort({ updatedAt: -1 });
    return sendSuccess(res, 200, "Tags loaded", {
      tags: await Promise.all(tags.map(serializeTag)),
    });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req, res, next) => {
  try {
    const name = normalizeTagName(req.body.name);
    if (!name) return sendError(res, 400, "Tag name is required");

    const tag = await Tag.create({
      userId: req.userId,
      name,
      color: req.body.color || "#d8a23a",
    });

    return sendSuccess(res, 201, "Tag created", { tag: await serializeTag(tag) });
  } catch (error) {
    if (error.code === 11000) return sendError(res, 409, "Tag already exists");
    next(error);
  }
};

export const updateTag = async (req, res, next) => {
  try {
    const tag = await Tag.findOne({ _id: req.params.id, userId: req.userId });
    if (!tag) return sendError(res, 404, "Tag not found");

    if (req.body.name !== undefined) {
      const name = normalizeTagName(req.body.name);
      if (!name) return sendError(res, 400, "Tag name is required");
      tag.name = name;
    }
    if (req.body.color !== undefined) tag.color = req.body.color || "#d8a23a";

    await tag.save();
    return sendSuccess(res, 200, "Tag updated", { tag: await serializeTag(tag) });
  } catch (error) {
    if (error.code === 11000) return sendError(res, 409, "Tag already exists");
    next(error);
  }
};

export const deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!tag) return sendError(res, 404, "Tag not found");
    return sendSuccess(res, 200, "Tag deleted", { tag: await serializeTag(tag) });
  } catch (error) {
    next(error);
  }
};
