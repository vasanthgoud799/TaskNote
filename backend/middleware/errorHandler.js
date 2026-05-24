import { sendError } from "../utils/respond.js";

export const notFound = (req, res) => {
  sendError(res, 404, `Route not found: ${req.originalUrl}`);
};

export const errorHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error.name === "CastError") {
    return sendError(res, 400, "Invalid resource id");
  }

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((entry) => entry.message)
      .join(", ");
    return sendError(res, 400, message || "Validation failed");
  }

  if (error.code === 11000) {
    return sendError(res, 409, "Duplicate value already exists");
  }

  return sendError(res, res.statusCode === 200 ? 500 : res.statusCode, "Internal server error");
};
