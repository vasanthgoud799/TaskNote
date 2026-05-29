import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from "../controllers/templateController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getTemplates);
router.post("/", createTemplate);
router.patch("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
