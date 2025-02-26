import React, { useRef, useState, useEffect } from "react";
import "./Profile.css";
import { useAppStore } from "../store";

const Profile = () => {
  const { userInfo } = useAppStore();
  const inputFileRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [userState, setUserState] = useState({
    firstName: userInfo?.firstName || "",
    lastName: userInfo?.lastName || "",
    email: userInfo?.email || "",
    profilePicture: userInfo?.image || "./female-avatar.png",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    // Apply the theme to the body when component mounts or theme changes
    // document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);

    // Function to detect changes in local storage
    const checkTheme = () => {
      const newTheme = localStorage.getItem("theme") || "light";
      if (newTheme !== theme) {
        setTheme(newTheme);
      }
    };

    // Periodically check if theme has changed in local storage
    const interval = setInterval(checkTheme, 500);

    return () => clearInterval(interval);
  }, [theme]);

  return (
    <div className={`profile-container ${theme}`}>
      <div className="profile-card">
        <div className="profile-sidebar">
          <div className="profile-pic-container">
            <img src={userState.profilePicture} alt="Profile" className="profile-pic" />
            <button className="change-img-btn" onClick={() => inputFileRef.current.click()}>
              ✉
            </button>
            <input type="file" onChange={(e) => {
              const image = e.target.files[0];
              if (!image) return;
              setUserState((prev) => ({ ...prev, profilePicture: URL.createObjectURL(image) }));
            }} ref={inputFileRef} className="hidden" />
          </div>
          <div className="profile-info">
            <h2>{userState.firstName} {userState.lastName}</h2>
            <p>{userState.email}</p>
          </div>
        </div>

        <div className="profile-details">
          {editMode ? (
            <>
              <div className="profile-field">
                <label>First Name</label>
                <input type="text" name="firstName" value={userState.firstName} onChange={(e) => setUserState({ ...userState, firstName: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>Last Name</label>
                <input type="text" name="lastName" value={userState.lastName} onChange={(e) => setUserState({ ...userState, lastName: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>Email</label>
                <input type="email" name="email" value={userState.email} onChange={(e) => setUserState({ ...userState, email: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>New Password</label>
                <input type="password" name="newPassword" value={userState.newPassword} onChange={(e) => setUserState({ ...userState, newPassword: e.target.value })} placeholder="Enter new password" />
              </div>
              <div className="profile-field">
                <label>Confirm Password</label>
                <input type="password" name="confirmNewPassword" value={userState.confirmNewPassword} onChange={(e) => setUserState({ ...userState, confirmNewPassword: e.target.value })} placeholder="Confirm new password" />
              </div>
              <div className="profile-buttons">
                <button className="save-btn" onClick={() => setEditMode(false)}>Save</button>
                <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
