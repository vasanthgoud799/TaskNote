import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getSettings);
router.patch("/", updateSettings);

export default router;
