import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const serializeProject = async (project) => {
  const [totalTasks, doneTasks] = await Promise.all([
    Task.countDocuments({ userId: project.userId, projectId: project._id, status: { $ne: "archived" } }),
    Task.countDocuments({ userId: project.userId, projectId: project._id, status: "done" }),
  ]);

  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    icon: project.icon,
    color: project.color,
    parentProjectId: project.parentProjectId?.toString() || null,
    progress: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    archived: project.archived,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.userId, archived: false }).sort({ updatedAt: -1 });
    return sendSuccess(res, 200, "Projects loaded", {
      projects: await Promise.all(projects.map(serializeProject)),
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description = "", icon = "folder", color = "sky", parentProjectId = null } = req.body;
    if (!name?.trim()) return sendError(res, 400, "Project name is required");

    const project = await Project.create({
      userId: req.userId,
      name: name.trim(),
      description,
      icon,
      color,
      parentProjectId,
    });

    return sendSuccess(res, 201, "Project created", { project: await serializeProject(project) });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return sendError(res, 404, "Project not found");

    ["name", "description", "icon", "color", "parentProjectId", "archived"].forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });
    if (!project.name?.trim()) return sendError(res, 400, "Project name is required");
    await project.save();

    return sendSuccess(res, 200, "Project updated", { project: await serializeProject(project) });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { archived: true },
      { new: true }
    );
    if (!project) return sendError(res, 404, "Project not found");
    return sendSuccess(res, 200, "Project archived", { project: await serializeProject(project) });
  } catch (error) {
    next(error);
  }
};
