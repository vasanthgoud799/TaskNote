import { Router } from "express";
import { subscribePush, testPush, unsubscribePush } from "../controllers/pushController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.use(verifyToken);
router.post("/subscribe", subscribePush);
router.delete("/unsubscribe", unsubscribePush);
router.post("/test", rateLimit({ max: 5 }), testPush);

export default router;
