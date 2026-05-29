import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import WorkspaceShell from "./workspace/TaskNoteWorkspace.jsx";

function SessionLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] text-[#f5f5f5]">
      <div className="flex items-center gap-3 text-[#b4b4b4]">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#262626] border-t-[#e6b957]" />
        Checking session
      </div>
    </main>
  );
}

function ProtectedApp({ page }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SessionLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <WorkspaceShell page={page} />;
}

function PublicAuthPage({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SessionLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in/*" element={<PublicAuthPage><Login /></PublicAuthPage>} />
      <Route path="/sign-up/*" element={<PublicAuthPage><Signup /></PublicAuthPage>} />
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
      <Route path="/signup" element={<Navigate to="/sign-up" replace />} />
      <Route path="/dashboard" element={<ProtectedApp page="dashboard" />} />
      <Route path="/inbox" element={<ProtectedApp page="inbox" />} />
      <Route path="/notes" element={<ProtectedApp page="notes" />} />
      <Route path="/tasks" element={<ProtectedApp page="tasks" />} />
      <Route path="/board" element={<ProtectedApp page="board" />} />
      <Route path="/calendar" element={<ProtectedApp page="calendar" />} />
      <Route path="/planner" element={<ProtectedApp page="planner" />} />
      <Route path="/projects" element={<ProtectedApp page="projects" />} />
      <Route path="/focus" element={<ProtectedApp page="focus" />} />
      <Route path="/analytics" element={<ProtectedApp page="analytics" />} />
      <Route path="/habits" element={<ProtectedApp page="habits" />} />
      <Route path="/tags" element={<ProtectedApp page="tags" />} />
      <Route path="/templates" element={<ProtectedApp page="templates" />} />
      <Route path="/reviews" element={<ProtectedApp page="reviews" />} />
      <Route path="/reminders" element={<ProtectedApp page="reminders" />} />
      <Route path="/settings" element={<ProtectedApp page="settings" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
