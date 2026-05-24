import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import deletedNoteRoutes from "./routes/deletedNoteRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { startReminderWorker } from "./services/ReminderWorker.js";

dotenv.config({ path: new URL(".env", import.meta.url) });

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskNote API is running",
    data: { status: "ok" },
  });
});

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/deleted-notes", deletedNoteRoutes);
app.use("/api/focus-sessions", focusRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tags", tagRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  startReminderWorker();
  const server = app.listen(port, () => {
    console.log(`TaskNote API running on http://localhost:${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Stop the existing server or set PORT to another value.`,
      );
      process.exit(1);
    }
    throw error;
  });
});
