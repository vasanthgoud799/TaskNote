import React, { useState } from "react";
import { FiHome, FiUser, FiMoon, FiTrash2, FiLogOut, FiMenu } from "react-icons/fi";
import "./home.css";
import Profile from "../components/Profile";
// Sample components for each section
const HomeSection = () => <div className="section-content"><h2>Home</h2></div>;

const ThemeSection = () => <div className="section-content"><h2>Theme</h2></div>;
const DeletedNotes = () => <div className="section-content"><h2>Deleted Notes</h2></div>;

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("Home");

  const renderSection = () => {
    switch (activeSection) {
      case "Home": return <HomeSection />;
      case "Profile": return <Profile />;
      case "Theme": return <ThemeSection />;
      case "Deleted Notes": return <DeletedNotes />;
      default: return <Home />;
    }
  };

  return (
    <div className="container">
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
          <SidebarItem Icon={FiMoon} label="Theme" onClick={() => setActiveSection("Theme")} isActive={activeSection === "Theme"} isSidebarOpen={isSidebarOpen} />
          <SidebarItem Icon={FiTrash2} label="Deleted" onClick={() => setActiveSection("Deleted Notes")} isActive={activeSection === "Deleted Notes"} isSidebarOpen={isSidebarOpen} />
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => console.log("Logout")}>
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
