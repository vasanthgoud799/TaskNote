import React, { useState, useEffect } from "react";
import { FiHome, FiUser, FiMoon, FiSun, FiTrash2, FiLogOut, FiMenu } from "react-icons/fi";
import "./home.css";
import Profile from "../components/Profile";
import { apiClient } from "../lib/api-client";
import { LOGOUT_ROUTE } from "../utils/constant";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import HomeSection from "../components/Home";
import DeletedNotes from "../components/DeletedNotes";
import { useAppStore } from "../store";

const Home = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("Home");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "Home":
        return <HomeSection />;
      case "Profile":
        return <Profile />;
      case "Deleted Notes":
        return <DeletedNotes />;
      default:
        return <HomeSection />;
    }
  };

  const handleLogout = async () => {
    try {
      const response = await apiClient.post(LOGOUT_ROUTE, {}, { withCredentials: true });

      if (response.status === 200) {
        setUserInfo(undefined);
        navigate("/login");
        toast.success("Logged Out Successfully");
      }
    } catch (error) {
      console.error("Error logging out:", error.response?.data?.message || error.message);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className={`container ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {isSidebarOpen && <h2 className="sidebar-title">TaskNote</h2>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="menu-btn">
            <FiMenu />
          </button>
        </div>
        <nav className="sidebar-nav">
          <SidebarItem Icon={FiHome} label="Home" onClick={() => setActiveSection("Home")} isActive={activeSection === "Home"} isSidebarOpen={isSidebarOpen} />
          <SidebarItem Icon={FiUser} label="Profile" onClick={() => setActiveSection("Profile")} isActive={activeSection === "Profile"} isSidebarOpen={isSidebarOpen} />
          <SidebarItem Icon={FiTrash2} label="Deleted" onClick={() => setActiveSection("Deleted Notes")} isActive={activeSection === "Deleted Notes"} isSidebarOpen={isSidebarOpen} />
          <SidebarItem Icon={isDarkMode ? FiSun : FiMoon} label={isDarkMode ? "Light Mode" : "Dark Mode"} onClick={toggleTheme} isActive={false} isSidebarOpen={isSidebarOpen} />
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            {isSidebarOpen && <span className="logout-text">Log out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isSidebarOpen ? "shifted" : ""}`}>
        <div className="section-container">{renderSection()}</div>
      </div>
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ Icon, label, onClick, isActive, isSidebarOpen }) => (
  <div onClick={onClick} className={`sidebar-item ${isActive ? "active" : ""}`}>
    <Icon className="sidebar-icon" />
    {isSidebarOpen && <span className="sidebar-label">{label}</span>}
  </div>
);

export default Home;
