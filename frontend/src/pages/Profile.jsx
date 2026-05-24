import React, { useRef, useState } from "react";
import { FiCamera, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "../api/apiClient.js";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import Header from "../components/layout/Header.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Profile = () => {
  const inputRef = useRef(null);
  const { user, getCurrentUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profileImage: user?.profileImage || "",
    phone: user?.phone || "",
    notificationPreferences: user?.notificationPreferences || {
      emailReminders: true,
      smsReminders: false,
      defaultChannels: ["email"],
    },
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    updateField("profileImage", await fileToDataUrl(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (form.newPassword && form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await apiClient.put("/api/users/profile", form);
      await getCurrentUser();
      updateField("currentPassword", "");
      updateField("newPassword", "");
      toast.success("Profile updated");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title="Profile" subtitle="Manage your identity and account preferences." onMenu={openMenu} />
          <form className="profile-layout" onSubmit={handleSubmit}>
            <section className="profile-card-large">
              <button className="profile-image-editor" type="button" onClick={() => inputRef.current?.click()}>
                {form.profileImage ? <img src={form.profileImage} alt="" /> : <FiCamera />}
                <span>Change image</span>
              </button>
              <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleImage} />
              <h2>{form.name || "Your profile"}</h2>
              <p>{form.email}</p>
            </section>

            <section className="profile-form panel">
              <Input
                label="Name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Phone for SMS reminders"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+15551234567"
              />
              <Input
                label="Current password"
                type="password"
                value={form.currentPassword}
                onChange={(event) => updateField("currentPassword", event.target.value)}
                placeholder="Required only when changing password"
                autoComplete="current-password"
              />
              <Input
                label="New password"
                type="password"
                value={form.newPassword}
                onChange={(event) => updateField("newPassword", event.target.value)}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
              />
              <Button type="submit" disabled={saving}>
                <FiSave />
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </section>
          </form>
        </>
      )}
    </AppShell>
  );
};

export default Profile;
