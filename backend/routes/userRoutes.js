import { Router } from "express";
import { updateProfile } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.put("/profile", verifyToken, updateProfile);

export default router;
