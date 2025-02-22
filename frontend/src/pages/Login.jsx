import { motion } from "framer-motion";
import "./Login.css";
import React from "react";
export default function Login() {
  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: -30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ rotateX: 8, rotateY: 8 }}
        className="login-box"
      >
        <h2 className="login-title">Welcome Back</h2>
        
        <div className="login-inputs">
          <motion.input 
            type="email" 
            placeholder="Email Address" 
            className="input-field"
            whileFocus={{ scale: 1.05 }} 
          />
          
          <motion.input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            whileFocus={{ scale: 1.05 }} 
          />
        </div>
        
        <div className="forgot-password">
          <a href="#">Forgot Password?</a>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.07, boxShadow: "0px 10px 20px rgba(233, 69, 96, 0.6)" }} 
          whileTap={{ scale: 0.95 }}
          className="login-button"
        >
          Login
        </motion.button>
        
        <p className="signup-text">
          Don't have an account? <a href="#">Sign Up</a>
        </p>
      </motion.div>
    </div>
  );
}
