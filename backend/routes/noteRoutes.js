import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteGraph,
  getNote,
  getNotes,
  toggleStarred,
  updateNote,
} from "../controllers/noteController.js";
import { getNoteVersions, restoreNoteVersion } from "../controllers/noteVersionController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);

router.get("/", getNotes);
router.post("/", createNote);
router.get("/graph", getNoteGraph);
router.get("/:noteId/versions", getNoteVersions);
router.post("/:noteId/versions/:versionId/restore", restoreNoteVersion);
router.get("/:noteId", getNote);
router.put("/:noteId", updateNote);
router.patch("/:noteId/star", toggleStarred);
router.delete("/:noteId", deleteNote);

export default router;
