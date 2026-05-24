import mongoose from "mongoose";

const connectDB = async () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!databaseUrl) {
    console.error("DATABASE_URL, MONGODB_URI, or MONGO_URI is required");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
