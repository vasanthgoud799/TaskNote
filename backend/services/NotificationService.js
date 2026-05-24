import { EmailProvider } from "./EmailProvider.js";
import { PushProvider } from "./PushProvider.js";
import UserSettings from "../models/UserSettings.js";

export class NotificationService {
  constructor() {
    this.email = new EmailProvider();
    this.push = new PushProvider();
  }

  async sendReminder(reminder, offset) {
    const settings = await UserSettings.findOne({ clerkUserId: reminder.clerkUserId });
    const results = [];
    const due = new Date(reminder.dueAt).toLocaleString();
    const text = `Hi ${settings?.name || "there"},

This is your TaskNote reminder.

Title: ${reminder.title}
Due: ${due}
Reminder: ${offset} minutes before

Open TaskNote to continue.`;

    if (reminder.channels.includes("email") && settings?.emailReminders !== false) {
      const result = await this.email.send({
        to: settings?.email,
        subject: `TaskNote Reminder: ${reminder.title}`,
        text,
      });
      results.push(result);
    }

    if (reminder.channels.includes("push") && settings?.pushReminders !== false) {
      const result = await this.push.sendToUser(reminder.clerkUserId, {
        title: "TaskNote Reminder",
        body: `${reminder.title} is due ${offset === 0 ? "now" : `in ${offset} minutes`}`,
        url: routeForReminder(reminder),
      });
      results.push(result);
    }

    if (!results.length) {
      throw new Error("No enabled notification channels are available for this reminder");
    }
    return results;
  }

  async sendTest(settings, channel, clerkUserId) {
    if (channel === "email") {
      return this.email.send({
        to: settings.email,
        subject: "TaskNote test reminder",
        text: "Your email reminders are ready.",
      });
    }

    if (channel === "push") {
      return this.push.sendToUser(clerkUserId, {
        title: "TaskNote test",
        body: "Push reminders are ready.",
        url: "/settings",
      });
    }

    throw new Error("Unsupported notification channel");
  }
}

const routeForReminder = (reminder) => {
  if (reminder.targetType === "task") return `/tasks?id=${reminder.targetId}`;
  if (reminder.targetType === "note") return `/notes?id=${reminder.targetId}`;
  if (reminder.targetType === "habit") return `/habits?id=${reminder.targetId}`;
  if (reminder.targetType === "focus") return "/focus";
  return "/calendar";
};

export const notificationService = new NotificationService();
