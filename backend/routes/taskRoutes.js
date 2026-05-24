import { Router } from "express";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
