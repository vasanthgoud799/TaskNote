import jwt from "jsonwebtoken";
import { sendError } from "../utils/respond.js";

export const verifyToken = (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  const token = req.cookies?.jwt || bearer;

  if (!token) {
    return sendError(res, 401, "Authentication required");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_KEY || "tasknote-dev-secret-change-me",
    );
    const userId = decoded.userId || decoded.sub;

    if (!userId) {
      return sendError(res, 401, "Invalid session");
    }

    req.userId = userId;
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired session");
  }
};
