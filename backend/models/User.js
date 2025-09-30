import { genSalt, hash } from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    required: false,
  },
});

// Hash password before saving the user document
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Only hash if password is modified or new
    const salt = await genSalt();
    this.password = await hash(this.password, salt);
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
