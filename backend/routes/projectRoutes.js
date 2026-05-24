import { Router } from "express";
import { createProject, deleteProject, getProjects, updateProject } from "../controllers/projectController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getProjects);
router.post("/", createProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
