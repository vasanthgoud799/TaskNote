import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./login.css";
import React from "react";
import { useState } from "react";

import { LOGIN_ROUTE } from "../utils/constant";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";
import { useAppStore } from "../store";
export default function Login() {
  const navigate = useNavigate();
  const {setUserInfo}=useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

  const validateLogin = () => {
    toast.success("yes")
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    
    if (validateLogin()) {
      
      try {
        const response = await apiClient.post(LOGIN_ROUTE, { email, password }, { withCredentials: true });
        console.log(response)
        if (response.status === 200) {
          const user = response.data.user;
          setUserInfo(user); 
         

        
          setEmail("");
          setPassword("");
      
            navigate("/Home");
          
        }
      } catch (error) {
        toast.error("Login failed. Please try again.");
      }
    }
  };
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            whileFocus={{ scale: 1.05 }} 
          />
          
          <motion.input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            whileFocus={{ scale: 1.05 }} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="forgot-password">
          <a href="#">Forgot Password?</a>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.07, boxShadow: "0px 10px 20px rgba(233, 69, 96, 0.6)" }} 
          whileTap={{ scale: 0.95 }}
          className="login-button"
          onClick={handleLogin}
        >
          Login
        </motion.button>
        
        <p className="signup-text">
          Don't have an account? 
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
          > Sign Up</a>
        </p>
      </motion.div>
    </div>
  );
}
