import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { compare } from "bcrypt";

const dur = 3 * 24 * 60 * 60 * 1000; // Example token duration

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, { expiresIn: dur });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const auth = await compare(password, user.password);
    if (!auth) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    res.cookie("jwt", createToken(email, user.id), {
      dur,
      // Ensure the cookie is not accessible from JavaScript
      secure: true, // Set to true if using HTTPS
      sameSite: "None", // Adjust this based on your needs
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        gender: user.gender,
        notes: user.notes,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signUp = async (req, res) => {
  try {
    const { image, firstName, lastName, email, password, gender } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      image,
      gender,
    });

    res.cookie("jwt", createToken(email, user.id), {
      dur,
      secure: true,
      sameSite: "None",
    });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error during sign up:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send("User with given id not found");
    }
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        gender: user.gender,
        notes: user.notes,
      },
    });
  } catch (err) {
    console.error("Error during sign up:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, newPassword, profilePicture } =
      req.body;
    const userId = req.userId;

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (profilePicture) user.image = profilePicture;
    if (newPassword) {
      user.password = newPassword;
    }

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.log("save");
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      dur: 0,
      secure: true,
      sameSite: "None",
    });
    return res.status(200).send("Logout Successful");
  } catch (error) {
    console.error("Error logging out", error);
    res.status(500).json({ message: "Error Logging out", error });
  }
};
