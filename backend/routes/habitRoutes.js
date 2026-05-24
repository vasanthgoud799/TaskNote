import { Router } from "express";
import { createHabit, deleteHabit, getHabits, toggleHabitToday, updateHabit } from "../controllers/habitController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getHabits);
router.post("/", createHabit);
router.patch("/:id", updateHabit);
router.post("/:id/toggle-today", toggleHabitToday);
router.delete("/:id", deleteHabit);

export default router;
