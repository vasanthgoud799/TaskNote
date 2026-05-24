import { Router } from "express";
import { createFocusSession, getFocusSessions } from "../controllers/focusController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getFocusSessions);
router.post("/", createFocusSession);

export default router;
