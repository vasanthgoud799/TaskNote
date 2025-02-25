import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../controllers/noteController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const noteRoutes = Router();

noteRoutes.post("/create-note", createNote);
noteRoutes.get("/get-notes", verifyToken, getNotes);
noteRoutes.post("/delete-note", deleteNote);
noteRoutes.put("/update-note", updateNote);

export default noteRoutes;
