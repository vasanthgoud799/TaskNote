import { useState } from "react";
import { FiHome, FiUser, FiMoon, FiTrash2, FiLogOut, FiMenu } from "react-icons/fi";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="d-flex vh-100 bg-dark text-white">
      {/* Sidebar */}
      <div className={`bg-secondary p-3 transition-all ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {/* Sidebar Header */}
        <div className="d-flex align-items-center justify-content-between">
          <h2 className="fs-4 fw-bold">Real Notes</h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="btn btn-light">
            <FiMenu />
          </button>
        </div>

        {/* Sidebar Items */}
        <nav className="mt-4">
          <SidebarItem Icon={FiHome} label="Home" />
          <SidebarItem Icon={FiUser} label="Profile" />
          <SidebarItem Icon={FiMoon} label="Theme" />
          <SidebarItem Icon={FiTrash2} label="Deleted Notes" />
        </nav>

        {/* Language Selector & Logout */}
        <div className="position-absolute bottom-0 start-0 p-3 w-100">
          <p className="small">Change Language</p>
          <select className="form-select bg-dark text-white">
            <option>English</option>
            <option>Spanish</option>
          </select>
          <button className="btn btn-danger w-100 mt-3 d-flex align-items-center gap-2">
            <FiLogOut />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h1 className="fw-bold">Your Notes</h1>

        {/* Tabs */}
        <div className="d-flex mt-4 border-bottom pb-2">
          <Tab label="All" count={0} />
          <Tab label="Starred" count={0} />
        </div>

        {/* Search */}
        <div className="mt-4">
          <input type="text" placeholder="Search notes" className="form-control w-50" />
        </div>

        {/* Empty State */}
        <div className="d-flex flex-column align-items-center mt-5">
          <img
            src="https://cdni.iconscout.com/illustration/free/thumb/free-documentation-2130363-1794195.png"
            alt="Empty Notes"
            className="w-50"
          />
          <p className="mt-3 text-secondary">You haven't starred any notes yet</p>
        </div>

        {/* Floating Add Button */}
        <button className="btn btn-primary rounded-circle position-fixed bottom-3 end-3 p-3 fs-4">
          +
        </button>
      </div>
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ Icon, label }) => (
  <div className="d-flex align-items-center gap-3 p-2 rounded bg-dark text-white mt-2 cursor-pointer">
    <Icon className="fs-5" />
    <span>{label}</span>
  </div>
);

// Tab Component
const Tab = ({ label, count }) => (
  <div className="position-relative px-3 cursor-pointer">
    <span className="fs-5">{label} ({count})</span>
    <div className="w-100 bg-primary mt-1" style={{ height: "3px" }}></div>
  </div>
);

export default Home;
