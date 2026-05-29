import { Router } from "express";
import {
  completeTimeBlock,
  createTimeBlock,
  deleteTimeBlock,
  getTimeBlocks,
  updateTimeBlock,
} from "../controllers/timeBlockController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", getTimeBlocks);
router.post("/", createTimeBlock);
router.patch("/:id", updateTimeBlock);
router.post("/:id/complete", completeTimeBlock);
router.delete("/:id", deleteTimeBlock);

export default router;
