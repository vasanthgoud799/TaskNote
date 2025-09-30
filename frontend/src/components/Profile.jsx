import React, { useRef, useState, useEffect } from "react";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";
import "./Profile.css";
import { useAppStore } from "../store";
import { UPDATE_PROFILE_ROUTE } from "../utils/constant";

const Profile = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const inputFileRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [userState, setUserState] = useState({
    firstName: userInfo?.firstName || "",
    lastName: userInfo?.lastName || "",
    email: userInfo?.email || "",
    profilePicture: userInfo?.image || "./male-avatar.png",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    document.body.classList.add(theme);

    const checkTheme = () => {
      const newTheme = localStorage.getItem("theme") || "light";
      if (newTheme !== theme) {
        setTheme(newTheme);
      }
    };

    const interval = setInterval(checkTheme, 500);
    return () => clearInterval(interval);
  }, [theme]);

  // Convert image to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file); // Read the file as base64
    });
  };

  const handleSave = async () => {
    if (userState.newPassword !== userState.confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await apiClient.put(UPDATE_PROFILE_ROUTE, {
        userId: userInfo.id,
        firstName: userState.firstName,
        lastName: userState.lastName,
        email: userState.email,
        profilePicture: userState.profilePicture, // Send Base64 to backend
        newPassword: userState.newPassword,
      }, { withCredentials: true });

      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        setUserInfo(response.data.updatedUser);
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  return (
    <div className={`profile-container ${theme}`}>
      <div className="profile-card">
        <div className="profile-sidebar">
          <div className="profile-pic-container">
            <img src={userState.profilePicture} alt="Profile" className="profile-pic" />
            <button className="change-img-btn" onClick={() => inputFileRef.current.click()}>✉</button>
            <input
              type="file"
              onChange={async (e) => {
                const image = e.target.files[0];
                if (!image) return;

                try {
                  const base64Image = await convertToBase64(image); // Convert to base64
                  setUserState((prev) => ({ ...prev, profilePicture: base64Image })); // Update state with Base64
                } catch (error) {
                  toast.error("Failed to convert image to Base64.");
                }
              }}
              ref={inputFileRef}
              className="hidden"
            />
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
                <input type="text" value={userState.firstName} onChange={(e) => setUserState({ ...userState, firstName: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>Last Name</label>
                <input type="text" value={userState.lastName} onChange={(e) => setUserState({ ...userState, lastName: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>Email</label>
                <input type="email" value={userState.email} onChange={(e) => setUserState({ ...userState, email: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>New Password</label>
                <input type="password" value={userState.newPassword} onChange={(e) => setUserState({ ...userState, newPassword: e.target.value })} placeholder="Enter new password" />
              </div>
              <div className="profile-field">
                <label>Confirm Password</label>
                <input type="password" value={userState.confirmNewPassword} onChange={(e) => setUserState({ ...userState, confirmNewPassword: e.target.value })} placeholder="Confirm new password" />
              </div>
              <div className="profile-buttons">
                <button className="save-btn" onClick={handleSave}>Save</button>
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
