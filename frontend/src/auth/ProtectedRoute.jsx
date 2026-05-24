import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loader from "../components/common/Loader.jsx";
import { useAuth } from "./AuthProvider.jsx";

const SESSION_CHECK_TIMEOUT_MS = 1800;

const useSessionCheckTimedOut = (isCheckingSession) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isCheckingSession) {
      setTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setTimedOut(true), SESSION_CHECK_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isCheckingSession]);

  return timedOut;
};

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, loadingAction } = useAuth();
  const isCheckingSession = isLoading && loadingAction === "getCurrentUser";
  const timedOut = useSessionCheckTimedOut(isCheckingSession);

  if (isCheckingSession && !timedOut) {
    return <Loader label="Restoring your workspace" fullScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading, loadingAction } = useAuth();
  const isCheckingSession = isLoading && loadingAction === "getCurrentUser";
  const timedOut = useSessionCheckTimedOut(isCheckingSession);

  if (isCheckingSession && !timedOut) {
    return <Loader label="Checking session" fullScreen />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};
