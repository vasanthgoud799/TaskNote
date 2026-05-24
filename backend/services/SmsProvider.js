export class SmsProvider {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || "dev";
  }

  async send({ to, text }) {
    if (this.provider !== "twilio") {
      console.log(`[sms:${this.provider}] ${to} | ${text}`);
      return { provider: this.provider, id: `dev-sms-${Date.now()}` };
    }

    throw new Error("Twilio provider is configured but no Twilio adapter is installed. Add twilio to enable SMS.");
  }
}
