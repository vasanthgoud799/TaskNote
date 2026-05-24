export class EmailProvider {
  constructor() {
    this.provider = null;
  }

  getProvider() {
    return process.env.EMAIL_PROVIDER || (process.env.SMTP_HOST ? "smtp" : "dev");
  }

  isConfigured() {
    const provider = this.getProvider();
    if (provider !== "smtp") return true;
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
  }

  async send({ to, subject, text }) {
    if (!to) {
      throw new Error("No email address is available for this reminder");
    }

    const provider = this.getProvider();

    if (provider !== "smtp") {
      console.log(`[email:${provider}] ${to} | ${subject} | ${text}`);
      return { provider, id: `dev-email-${Date.now()}` };
    }

    if (!this.isConfigured()) {
      throw new Error("SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.");
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_PORT) === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });

    return { provider: "smtp", id: result.messageId };
  }
}
