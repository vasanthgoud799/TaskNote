import { Router } from "express";
import { exportJson, exportNotesMarkdown, exportTasksCsv, importJson } from "../controllers/dataPortabilityController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/export/json", exportJson);
router.get("/export/tasks.csv", exportTasksCsv);
router.get("/export/notes", exportNotesMarkdown);
router.post("/import/json", importJson);

export default router;
