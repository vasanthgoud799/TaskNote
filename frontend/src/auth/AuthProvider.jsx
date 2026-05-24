import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, setApiToken } from "../api/apiClient.js";

const AuthContext = createContext(null);

const normalizeUser = (user) =>
  user
    ? {
        ...user,
        id: user.id || user._id,
        name: user.name || user.email?.split("@")[0] || "TaskNote User",
        email: user.email || "",
      }
    : null;

const readUser = (response) =>
  normalizeUser(response?.data?.data?.user || response?.data?.user || response?.data?.data || null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = async () => {
    setIsLoading(true);
    try {
      setApiToken(null);
      const response = await apiClient.get("/api/auth/me");
      setUser(readUser(response));
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void restoreSession();
  }, []);

  const loginWithPassword = async ({ email, password }) => {
    const response = await apiClient.post("/api/auth/login", { email, password });
    const nextUser = readUser(response);
    setUser(nextUser);
    return nextUser;
  };

  const signup = async ({ name, email, password, profileImage = "" }) => {
    const response = await apiClient.post("/api/auth/signup", {
      name,
      email,
      password,
      profileImage,
    });
    const nextUser = readUser(response);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      setApiToken(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      loadingAction: isLoading ? "getCurrentUser" : null,
      loginWithPassword,
      signup,
      logout,
      getCurrentUser: restoreSession,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
