import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiHome,
  FiLogOut,
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiFileText,
  FiPlus,
  FiSettings,
  FiClipboard,
  FiTag,
  FiZap,
} from "react-icons/fi";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthProvider.jsx";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/notes", label: "Notes", icon: FiFileText },
  { to: "/tasks", label: "Tasks", icon: FiCheckSquare },
  { to: "/board", label: "Board", icon: FiGrid },
  { to: "/calendar", label: "Calendar", icon: FiCalendar },
  { to: "/focus", label: "Focus", icon: FiZap },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/habits", label: "Habits", icon: FiClipboard },
  { to: "/tags", label: "Tags", icon: FiTag },
];

const Sidebar = ({ mobileOpen, onClose, onQuickAdd }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <FiCheckSquare />
        </div>
        <div>
          <strong>TaskNote</strong>
        </div>
      </div>

      <button className="quick-add-button" type="button" onClick={onQuickAdd}>
        <FiPlus />
        <span>Quick Add</span>
        <kbd>⌘ K</kbd>
      </button>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"} onClick={onClose}>
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button className="sidebar-user" type="button" onClick={() => navigate("/profile")}>
        <strong>{user?.name || "TaskNote user"}</strong>
        <span>{user?.email}</span>
      </button>

      <NavLink className="settings-link" to="/settings" onClick={onClose}>
        <FiSettings />
        <span>Settings</span>
      </NavLink>

      <button className="logout-link" type="button" onClick={handleLogout}>
        <FiLogOut />
        <span>Sign out</span>
      </button>
    </aside>
  );
};

export default Sidebar;
