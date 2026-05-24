import React from "react";

const Loader = ({ label = "Loading", fullScreen = false }) => (
  <div className={fullScreen ? "loader-screen" : "loader-inline"}>
    <div className="spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default Loader;
