import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseUrl = process.env.DATABASE_URL;

app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Enable cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
// Increase the limit for JSON payloads
app.use(express.json({ limit: "10mb" })); // Adjust the limit as needed

// Increase the limit for URL-encoded payloads

app.use("/api/auth", authRoutes);

mongoose
  .connect(databaseUrl)
  .then(() => {
    console.log("Database Connection successful");
  })
  .catch(() => {
    console.log("err.message");
  });

const server = app.listen(port, () => {
  console.log(`Server is running at https:/localhost:${port}`);
});
