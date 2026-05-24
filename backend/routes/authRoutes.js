import { Router } from "express";
import {
  getCurrentUser,
  getUserInfo,
  login,
  logout,
  refreshToken,
  resetPassword,
  sendOtp,
  signup,
  verifyOtp,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password/reset", resetPassword);
router.post("/logout", logout);
router.get("/me", verifyToken, getUserInfo);
router.get("/user-info", verifyToken, getUserInfo);
router.get("/get-current-user", verifyToken, getCurrentUser);

export default router;
