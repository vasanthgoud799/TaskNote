import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/userRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseUrl = process.env.DATABASE_URL;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173","https://task-note-phi.vercel.app","https://tasknote-hu4v.onrender.com","https://task-note-axoswgrm9-vasanths-projects-af7e2121.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Enable cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
// Increase the limit for JSON payloads
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Increase the limit for URL-encoded payloads

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

mongoose
  .connect(databaseUrl)
  .then(() => {
    console.log("Database Connection successful");
  })
  .catch((err) => {
    console.log(err.message);
  });

const server = app.listen(port, () => {
  console.log(`Server is running at http:/localhost:${port}/`);
});
