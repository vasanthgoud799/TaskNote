import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
      default: null,
    },
    channel: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "dev",
    },
  },
  { timestamps: true }
);

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export default NotificationLog;
