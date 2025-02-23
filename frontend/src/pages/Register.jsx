import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const navigate = useNavigate();
  const isValidEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const validateSignUp = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    // if (password !== confirmPassword) {
    //   toast.error("Passwords do not match.");
    //   return false;
    // }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const maleAvatar = "./male-avatar.png";
  const femaleAvatar = "./female-avatar.png";

  const [image, setProfileImage] = useState(maleAvatar);
  const [gender, setGender] = useState("male");

  const handleGenderChange = (event) => {
    const selectedGender = event.target.value;
    setGender(selectedGender);
    setProfileImage(selectedGender === "male" ? maleAvatar : femaleAvatar);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSignUp = async () => {
    if (validateSignUp()) {
      if (!isValidEmail(email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      try {
        const response = await apiClient.post(SIGNUP_ROUTE, { email, password,firstName,lastName,image,gender }, { withCredentials: true });
        if (response.status === 201) {
          // setUserInfo(response.data.user); 
          // navigate("/verify-otp", { state: { email } });
          // const res = await apiClient.post(REQUEST_OTP_ROUTE, { email }, { withCredentials: true });
          // if (res.status === 201) {
            toast.success("Registered successfully");
            
            navigate("/login");
          // }
        }
      } catch (error) {
        
        toast.error("Sign up failed. Please try again.");
      }
    }
  };

  return (
    <div className="register-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ rotateX: 8, rotateY: 8 }}
        className="register-box"
      >
        <h2 className="register-title">Create Account</h2>

        {/* Profile Upload */}
        <motion.div className="profile-section">
          <motion.label
            htmlFor="profile-upload"
            whileHover={{ scale: 1.1 }}
            className="profile-label"
          >
            <motion.img
              src={image}
              alt="Profile"
              className="profile-image"
              whileHover={{ scale: 1.05 }}
            />
          </motion.label>
          <input
            type="file"
            id="profile-upload"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </motion.div>

        {/* Input Fields */}
        <div className="register-inputs">
          <motion.input
            type="text"
            placeholder="First Name"
            className="input-field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            whileFocus={{ scale: 1.05 }}
          />

          <motion.input
            type="text"
            placeholder="Last Name"
            className="input-field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            whileFocus={{ scale: 1.05 }}
          />

          <motion.input
            type="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            whileFocus={{ scale: 1.05 }}
          />

          <motion.input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            whileFocus={{ scale: 1.05 }}
          />
        </div>

        {/* Gender Selection */}
        <motion.div className="gender-selection">
          <motion.label whileHover={{ scale: 1.05 }}>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === "male"}
              onChange={handleGenderChange}
            />{" "}
            Male
          </motion.label>
          <motion.label whileHover={{ scale: 1.05 }}>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === "female"}
              onChange={handleGenderChange}
            />{" "}
            Female
          </motion.label>
        </motion.div>

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: 1.07, boxShadow: "0px 10px 20px rgba(233, 69, 96, 0.6)" }}
          whileTap={{ scale: 0.95 }}
          className="register-button"
          onClick={handleSignUp}
        >
          Register
        </motion.button>

        {/* Already have an account? */}
        <p className="login-text">
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Login
          </a>
        </p>
      </motion.div>
    </div>
  );
}
