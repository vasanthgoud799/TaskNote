import { Router } from "express";
import { globalSearch } from "../controllers/searchController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", globalSearch);

export default router;
