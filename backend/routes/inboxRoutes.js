import { Router } from "express";
import {
  convertInboxToHabit,
  convertInboxToNote,
  convertInboxToTask,
  createInboxItem,
  deleteInboxItem,
  getInboxItems,
  updateInboxItem,
} from "../controllers/inboxController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getInboxItems);
router.post("/", createInboxItem);
router.patch("/:id", updateInboxItem);
router.delete("/:id", deleteInboxItem);
router.post("/:id/convert-to-note", convertInboxToNote);
router.post("/:id/convert-to-task", convertInboxToTask);
router.post("/:id/convert-to-habit", convertInboxToHabit);

export default router;
