import Template from "../models/Template.js";
import { sendError, sendSuccess } from "../utils/respond.js";

const builtInTemplates = [
  { id: "builtin-meeting", name: "Meeting Notes", type: "note", body: "# Meeting notes\n\n## Attendees\n\n## Decisions\n\n## Action items", isBuiltIn: true },
  { id: "builtin-daily-plan", name: "Daily Plan", type: "task", body: "Plan the day", defaults: { priority: "medium" }, isBuiltIn: true },
  { id: "builtin-weekly-review", name: "Weekly Review", type: "review", body: "## Wins\n\n## Lessons\n\n## Next week", isBuiltIn: true },
  { id: "builtin-project-plan", name: "Project Plan", type: "project", body: "## Goal\n\n## Milestones\n\n## Risks", isBuiltIn: true },
  { id: "builtin-study", name: "Study Session", type: "note", body: "# Study session\n\n## Topic\n\n## Key ideas\n\n## Questions", isBuiltIn: true },
  { id: "builtin-bug", name: "Bug Report", type: "note", body: "# Bug report\n\n## Expected\n\n## Actual\n\n## Steps", isBuiltIn: true },
  { id: "builtin-goal", name: "Goal Tracker", type: "project", body: "## Goal\n\n## Metric\n\n## Weekly checkpoints", isBuiltIn: true },
];

const serializeTemplate = (template) => ({
  id: template._id?.toString() || template.id,
  name: template.name,
  type: template.type,
  body: template.body || "",
  defaults: template.defaults || {},
  isBuiltIn: Boolean(template.isBuiltIn),
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
});

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find({ userId: req.userId }).sort({ updatedAt: -1 });
    return sendSuccess(res, 200, "Templates loaded", {
      templates: [...builtInTemplates, ...templates.map(serializeTemplate)],
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return sendError(res, 400, "Template name is required");
    const template = await Template.create({
      userId: req.userId,
      name,
      type: req.body.type || "note",
      body: req.body.body || "",
      defaults: req.body.defaults || {},
    });
    return sendSuccess(res, 201, "Template created", { template: serializeTemplate(template) });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $set: {
          ...(req.body.name !== undefined ? { name: req.body.name } : {}),
          ...(req.body.type !== undefined ? { type: req.body.type } : {}),
          ...(req.body.body !== undefined ? { body: req.body.body } : {}),
          ...(req.body.defaults !== undefined ? { defaults: req.body.defaults } : {}),
        },
      },
      { new: true },
    );
    if (!template) return sendError(res, 404, "Template not found");
    return sendSuccess(res, 200, "Template updated", { template: serializeTemplate(template) });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!template) return sendError(res, 404, "Template not found");
    return sendSuccess(res, 200, "Template deleted");
  } catch (error) {
    next(error);
  }
};
