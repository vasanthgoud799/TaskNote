import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    emailReminders: { type: Boolean, default: true },
    pushReminders: { type: Boolean, default: false },
    defaultReminderOffsets: { type: [Number], default: [30, 5, 1] },
    defaultReminderChannels: { type: [String], enum: ["push", "email"], default: ["push"] },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: "22:00" },
      end: { type: String, default: "07:00" },
      delayPush: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const UserSettings = mongoose.model("UserSettings", userSettingsSchema);

export default UserSettings;
