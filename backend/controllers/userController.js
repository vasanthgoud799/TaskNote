import User from "../models/User.js";
import { sendError, sendSuccess } from "../utils/respond.js";
import { serializeUser } from "../utils/serializers.js";
import { isValidPhone, normalizePhone } from "../utils/phoneUtils.js";

const isBase64Image = (value) =>
  typeof value === "string" &&
  (value === "" || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value) || value.startsWith("/"));

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, profileImage, phone, notificationPreferences } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (email && email.toLowerCase() !== user.email) {
      const emailTaken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (emailTaken) {
        return sendError(res, 409, "Email is already in use");
      }
      user.email = email.toLowerCase();
    }

    if (typeof name === "string") {
      user.name = name.trim();
    }

    if (typeof profileImage === "string") {
      if (!isBase64Image(profileImage)) {
        return sendError(res, 400, "Profile image must be a valid image data URL");
      }
      user.profileImage = profileImage;
    }

    if (phone !== undefined) {
      if (!isValidPhone(phone)) {
        return sendError(res, 400, "Enter a valid phone number with country code");
      }
      user.phone = normalizePhone(phone);
    }

    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
        defaultChannels: Array.isArray(notificationPreferences.defaultChannels)
          ? notificationPreferences.defaultChannels.filter((channel) => ["email", "sms"].includes(channel))
          : user.notificationPreferences.defaultChannels,
      };
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return sendError(res, 400, "New password must be at least 6 characters");
      }

      if (!currentPassword || !(await user.matchPassword(currentPassword))) {
        return sendError(res, 401, "Current password is incorrect");
      }

      user.password = newPassword;
    }

    await user.save();

    return sendSuccess(res, 200, "Profile updated", { user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};
