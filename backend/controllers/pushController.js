import PushSubscription from "../models/PushSubscription.js";
import UserSettings from "../models/UserSettings.js";
import { notificationService } from "../services/NotificationService.js";
import { sendError, sendSuccess } from "../utils/respond.js";

export const subscribePush = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return sendError(res, 400, "A valid push subscription is required");
    }
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          clerkUserId: req.userId,
          keys,
          userAgent: req.get("user-agent") || "",
        },
      },
      { new: true, upsert: true }
    );
    await UserSettings.findOneAndUpdate(
      { clerkUserId: req.userId },
      { $set: { pushReminders: true }, $setOnInsert: { clerkUserId: req.userId } },
      { new: true, upsert: true }
    );
    return sendSuccess(res, 201, "Push notifications enabled", { subscriptionId: subscription._id.toString() });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePush = async (req, res, next) => {
  try {
    if (req.body.endpoint) {
      await PushSubscription.deleteOne({ endpoint: req.body.endpoint, clerkUserId: req.userId });
    } else {
      await PushSubscription.deleteMany({ clerkUserId: req.userId });
    }
    await UserSettings.findOneAndUpdate({ clerkUserId: req.userId }, { $set: { pushReminders: false } });
    return sendSuccess(res, 200, "Push notifications disabled");
  } catch (error) {
    next(error);
  }
};

export const testPush = async (req, res, next) => {
  try {
    await notificationService.sendTest({ pushReminders: true }, "push", req.userId);
    return sendSuccess(res, 200, "Test push sent");
  } catch (error) {
    next(error);
  }
};
