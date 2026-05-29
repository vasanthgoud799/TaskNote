import { Router } from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getReviews);
router.post("/", createReview);

export default router;
