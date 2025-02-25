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

// // controllers/AuthController.js

// export const updateProfile = async (req, res) => {
//   try {
//     const { userId } = req;
//     // console.log("User ID in updateProfile:", userId); // Add this line for debugging
//     const { firstName, lastName, image, about } = req.body;

//     if (!userId) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: No user ID provided" });
//     }

//     if (!firstName || !lastName || !image) {
//       return res
//         .status(400)
//         .json({ message: "First Name, Last Name, and Image are required" });
//     }

//     const userData = await User.findByIdAndUpdate(
//       userId,
//       {
//         firstName,
//         lastName,
//         image,
//         about,
//         profileSetup: true,
//       },
//       { new: true, runValidators: true }
//     );

//     if (!userData) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       id: userData.id,
//       email: userData.email,
//       profileSetUp: userData.profileSetup,
//       firstName: userData.firstName,
//       lastName: userData.lastName,
//       image: userData.image,
//       about: userData.about,
//     });
//   } catch (error) {
//     console.error("Error updating profile:", error);
//     res.status(500).json({ message: "Error updating profile", error });
//   }
// };

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
