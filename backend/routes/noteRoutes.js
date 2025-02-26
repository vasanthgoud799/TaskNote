import { Router } from "express";
import {
  createNote,
  deleteNote,
  getDeletedNotes,
  getNotes,
  restoreNote,
  updateNote,
} from "../controllers/noteController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const noteRoutes = Router();

noteRoutes.post("/create-note", createNote);
noteRoutes.get("/get-notes", verifyToken, getNotes);
noteRoutes.post("/delete-note", deleteNote);
noteRoutes.put("/update-note", updateNote);
noteRoutes.post("/restore-note", restoreNote);
noteRoutes.get("/deleted-notes", verifyToken, getDeletedNotes);

export default noteRoutes;
