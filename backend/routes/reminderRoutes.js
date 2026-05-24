import { Router } from "express";
import {
  cancelTargetReminders,
  createReminder,
  deleteReminder,
  getReminders,
  testEmail,
  testPush,
  snoozeReminder,
  updateReminder,
} from "../controllers/reminderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.use(verifyToken);

router.get("/", getReminders);
router.post("/", createReminder);
router.patch("/:id", updateReminder);
router.delete("/:id", deleteReminder);
router.post("/:id/snooze", snoozeReminder);
router.post("/cancel-target", cancelTargetReminders);
router.post("/test-email", rateLimit({ max: 3 }), testEmail);
router.post("/test-push", rateLimit({ max: 5 }), testPush);

export default router;
