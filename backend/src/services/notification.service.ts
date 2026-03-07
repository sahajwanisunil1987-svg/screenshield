import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendOrderConfirmation = async (email: string, orderNumber: string) => {
  await transporter.sendMail({
    from: env.SMTP_USER,
    to: email,
    subject: `SpareKart Order ${orderNumber}`,
    html: `<p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>`
  });
};

export const sendWhatsappNotification = async (payload: unknown) => {
  if (!env.WHATSAPP_WEBHOOK_URL) {
    return { skipped: true };
  }

  const response = await fetch(env.WHATSAPP_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { ok: response.ok };
};
