import { motion } from "framer-motion";
import "./Register.css";
import React from "react";

export default function Register() {
  return (
    <div className="register-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ rotateX: 5, rotateY: 5 }}
        className="register-box"
      >
        <h2 className="register-title">Create an Account</h2>

        <div className="register-inputs">
          <motion.input
            type="text"
            placeholder="Full Name"
            className="input-field"
            whileFocus={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(255, 92, 141, 0.6)" }}
          />

          <motion.input
            type="email"
            placeholder="Email Address"
            className="input-field"
            whileFocus={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(255, 92, 141, 0.6)" }}
          />

          <motion.input
            type="password"
            placeholder="Password"
            className="input-field"
            whileFocus={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(255, 92, 141, 0.6)" }}
          />

          <motion.input
            type="password"
            placeholder="Confirm Password"
            className="input-field"
            whileFocus={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(255, 92, 141, 0.6)" }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.07, boxShadow: "0px 10px 20px rgba(233, 69, 96, 0.6)" }}
          whileTap={{ scale: 0.95 }}
          className="register-button"
        >
          Register
        </motion.button>

        <p className="login-text">
          Already have an account? <a href="#">Login</a>
        </p>
      </motion.div>
    </div>
  );
}
