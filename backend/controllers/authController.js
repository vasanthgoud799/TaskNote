import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getCookieOptions } from "../utils/cookies.js";
import { sendError, sendSuccess } from "../utils/respond.js";
import { serializeUser } from "../utils/serializers.js";

const otpStore = new Map();

const createAccessToken = (userId) =>
  jwt.sign(
    { userId, sub: userId.toString() },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_KEY || "tasknote-dev-secret-change-me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

const setAuthCookie = (res, userId) => {
  res.cookie("jwt", createAccessToken(userId), getCookieOptions());
};

const sdkSuccess = (res, message, data = {}) =>
  res.status(200).json({
    status: "success",
    message,
    data,
  });

const getOtpKey = ({ email, phone, purpose }) =>
  `${purpose}:${String(email || "").toLowerCase()}:${String(phone || "")}`;

const createOtp = () =>
  process.env.NODE_ENV === "production"
    ? crypto.randomInt(100000, 999999).toString()
    : "123456";

export const sendOtp = async (req, res) => {
  const { email, phone, purpose = "Authify_Register_user", name = "", password = "" } = req.body;

  if (!email && !phone) {
    return sendError(res, 400, "Email or phone is required");
  }

  const otp = createOtp();
  otpStore.set(getOtpKey({ email, phone, purpose }), {
    otp,
    name,
    password,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  console.log(`[auth-sdk otp] ${email || phone} ${purpose}: ${otp}`);

  return sdkSuccess(res, "OTP sent", {
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
};

export const verifyOtp = async (req, res) => {
  const { email, phone, otp, purpose = "Authify_Register_user" } = req.body;
  const key = getOtpKey({ email, phone, purpose });
  const record = otpStore.get(key);

  if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  otpStore.delete(key);

  let user = await User.findOne({ email: String(email || "").toLowerCase() });

  if (purpose.includes("Register")) {
    if (!user) {
      if (!record.password || record.password.length < 6) {
        return sendError(res, 400, "Password must be at least 6 characters");
      }
      user = await User.create({
        name: record.name,
        email,
        phone: phone || "",
        password: record.password,
      });
    }
  }

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const accessToken = createAccessToken(user._id);
  setAuthCookie(res, user._id);

  return sdkSuccess(res, "Authenticated", {
    accessToken,
    user: serializeUser(user),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    return sendError(res, 401, "Invalid email or password");
  }

  const accessToken = createAccessToken(user._id);
  setAuthCookie(res, user._id);

  return sendSuccess(res, 200, "Logged in", {
    accessToken,
    user: serializeUser(user),
  });
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) {
    return sendError(res, 401, "No active session");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_KEY || "tasknote-dev-secret-change-me",
    );
    const accessToken = createAccessToken(decoded.userId || decoded.sub);
    return sendSuccess(res, 200, "Token refreshed", { accessToken });
  } catch {
    return sendError(res, 401, "Invalid session");
  }
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  return sdkSuccess(res, "Current user loaded", { user: serializeUser(user) });
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return sendError(res, 400, "Email, OTP, and new password are required");
  }

  if (newPassword !== confirmPassword) {
    return sendError(res, 400, "Passwords do not match");
  }

  const key = getOtpKey({ email, purpose: "ForgotAuthOtp" });
  const record = otpStore.get(key);
  if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  user.password = newPassword;
  await user.save();
  otpStore.delete(key);

  return sdkSuccess(res, "Password reset");
};

export const logout = (_req, res) => {
  res.clearCookie("jwt", getCookieOptions());
  return sendSuccess(res, 200, "Logged out");
};

export const signup = async (req, res) => {
  const { name = "", email, password, profileImage = "" } = req.body;

  if (!email || !password) {
    return sendError(res, 400, "Email and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password, profileImage });
  const accessToken = createAccessToken(user._id);
  setAuthCookie(res, user._id);

  return sendSuccess(res, 201, "Account created", {
    accessToken,
    user: serializeUser(user),
  });
};

export const getUserInfo = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  return sendSuccess(res, 200, "Session restored", { user: serializeUser(user) });
};
