import bcrypt from "bcrypt";
import mongoose from "mongoose";
import noteSchema from "./Note.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: "",
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  profileImage: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
    trim: true,
  },
  notificationPreferences: {
    emailReminders: {
      type: Boolean,
      default: true,
    },
    smsReminders: {
      type: Boolean,
      default: false,
    },
    defaultChannels: {
      type: [String],
      enum: ["email", "sms"],
      default: ["email"],
    },
  },
  notes: [noteSchema],
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
