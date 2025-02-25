import { Router } from "express";
import {
  getUserInfo,
  login,
  logout,
  signUp,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

// import { requestOTP, validateOTP } from "../controllers/otpController.js";

const authRoutes = Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/login", login);
authRoutes.get("/user-info", verifyToken, getUserInfo);
// authRoutes.post("/update-profile", verifyToken, updateProfile);
authRoutes.post("/logout", logout);

// authRoutes.post("/request-otp", requestOTP);

// authRoutes.post("/validate-otp", validateOTP);
export default authRoutes;
