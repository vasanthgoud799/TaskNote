import webPush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

export class PushProvider {
  constructor() {
    this.configured = false;
    this.configuredKey = "";
    this.configure();
  }

  configure() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    const configuredKey = `${subject}:${publicKey}:${privateKey}`;
    const configured = Boolean(publicKey && privateKey && subject);

    if (configured && configuredKey !== this.configuredKey) {
      webPush.setVapidDetails(
        subject,
        publicKey,
        privateKey
      );
    }

    this.configured = configured;
    this.configuredKey = configuredKey;
    return configured;
  }

  isConfigured() {
    return this.configure();
  }

  async sendToUser(clerkUserId, payload) {
    if (!this.isConfigured()) {
      throw new Error("Web Push is not configured. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.");
    }

    const subscriptions = await PushSubscription.find({ clerkUserId });
    if (!subscriptions.length) {
      throw new Error("No push subscriptions are registered for this user");
    }

    const body = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webPush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          body
        )
      )
    );

    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length === results.length) {
      throw new Error(failures[0]?.reason?.message || "Push notification failed");
    }

    return { provider: "web-push", delivered: results.length - failures.length };
  }
}
