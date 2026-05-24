import { Router } from "express";
import {
  emptyTrash,
  getDeletedNotes,
  permanentlyDeleteNote,
  restoreDeletedNote,
} from "../controllers/deletedNoteController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);

router.get("/", getDeletedNotes);
router.post("/:deletedNoteId/restore", restoreDeletedNote);
router.delete("/", emptyTrash);
router.delete("/:deletedNoteId", permanentlyDeleteNote);

export default router;
