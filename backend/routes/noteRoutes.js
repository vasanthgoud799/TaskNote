import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNote,
  getNotes,
  toggleStarred,
  updateNote,
} from "../controllers/noteController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);

router.get("/", getNotes);
router.post("/", createNote);
router.get("/:noteId", getNote);
router.put("/:noteId", updateNote);
router.patch("/:noteId/star", toggleStarred);
router.delete("/:noteId", deleteNote);

export default router;
