import { Router } from "express";
import { createTag, deleteTag, getTags, updateTag } from "../controllers/tagController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getTags);
router.post("/", createTag);
router.patch("/:id", updateTag);
router.delete("/:id", deleteTag);

export default router;
