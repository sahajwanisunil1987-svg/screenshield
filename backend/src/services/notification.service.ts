import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

// ✅ SMTP Transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// ✅ Check if SMTP is properly configured
const hasConfiguredSmtp = () => {
  const placeholderHosts = new Set(["smtp.example.com", "example.com", "localhost"]);
  const placeholderUsers = new Set(["noreply@example.com", "example@example.com"]);
  const placeholderPasswords = new Set(["password", "changeme", "example"]);

  return !(
    placeholderHosts.has(env.SMTP_HOST) ||
    placeholderUsers.has(env.SMTP_USER) ||
    placeholderPasswords.has(env.SMTP_PASS)
  );
};

// ✅ Safe email sender (with error handling)
const sendMailOrLog = async (payload) => {
  if (!hasConfiguredSmtp() && env.NODE_ENV !== "production") {
    console.info(JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      message: "SMTP not configured in development. Email skipped.",
      to: payload.to,
      subject: payload.subject,
      debugUrl: payload.debugUrl ?? null
    }));
    return;
  }

  try {
    await transporter.sendMail({
      from: `"PurjiX" <${env.SMTP_USER}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html
    });

    console.log(`📧 Email sent to ${payload.to}`);

  } catch (error) {
    console.error("❌ Email send failed:", error);
  }
};

// ✅ Notifications (DB)

export const createNotification = async (payload) =>
  prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      href: payload.href,
      kind: payload.kind ?? "INFO"
    }
  });

export const listNotifications = async (userId) => {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.notification.count({
      where: { userId, isRead: false }
    })
  ]);

  return { items, unreadCount };
};

export const markNotificationRead = async (userId, notificationId) =>
  prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

export const markAllNotificationsRead = async (userId) =>
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

// ✅ Email Functions

export const sendOrderConfirmation = async (email, orderNumber) => {
  await sendMailOrLog({
    to: email,
    subject: `PurjiX Order ${orderNumber}`,
    html: `
      <div style="font-family:sans-serif">
        <h2>✅ Order Confirmed</h2>
        <p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
      </div>
    `
  });
};

export const sendVerificationEmail = async (email, verifyUrl) => {
  await sendMailOrLog({
    to: email,
    subject: "Verify your PurjiX account",
    html: `
      <p>Verify your account by clicking 
      <a href="${verifyUrl}">this link</a>.</p>
    `,
    debugUrl: verifyUrl
  });
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  await sendMailOrLog({
    to: email,
    subject: "Reset your PurjiX password",
    html: `
      <p>Reset your password by clicking 
      <a href="${resetUrl}">this link</a>.</p>
    `,
    debugUrl: resetUrl
  });
};

export const sendSupportTicketAcknowledgement = async (email, ticketId) => {
  await sendMailOrLog({
    to: email,
    subject: `PurjiX support request ${ticketId}`,
    html: `
      <p>We have received your support request.</p>
      <p>Reference ID: <strong>${ticketId}</strong></p>
      <p>Our team will review it shortly.</p>
    `
  });
};

// ✅ WhatsApp Notification

export const sendWhatsappNotification = async (payload) => {
  if (!env.WHATSAPP_WEBHOOK_URL) {
    return { skipped: true };
  }

  try {
    const response = await fetch(env.WHATSAPP_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return { ok: response.ok };

  } catch (err) {
    console.error("❌ WhatsApp error:", err);
    return { ok: false };
  }
};