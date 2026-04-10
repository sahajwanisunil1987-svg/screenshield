import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

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

const sendMailOrLog = async (payload: { to: string; subject: string; html: string; debugUrl?: string }) => {
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

  await transporter.sendMail({
    from: env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.html
  });
};

export const createNotification = async (payload: {
  userId: string;
  title: string;
  message: string;
  href?: string;
  kind?: string;
}) =>
  prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      href: payload.href,
      kind: payload.kind ?? "INFO"
    }
  });

export const listNotifications = async (userId: string) => {
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

export const markNotificationRead = async (userId: string, notificationId: string) =>
  prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

export const markAllNotificationsRead = async (userId: string) =>
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

export const sendOrderConfirmation = async (email: string, orderNumber: string) => {
  await sendMailOrLog({
    to: email,
    subject: `PurjiX Order ${orderNumber}`,
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


export const sendVerificationEmail = async (email: string, verifyUrl: string) => {
  await sendMailOrLog({
    to: email,
    subject: "Verify your PurjiX account",
    html: `<p>Verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`,
    debugUrl: verifyUrl
  });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  await sendMailOrLog({
    to: email,
    subject: "Reset your PurjiX password",
    html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`,
    debugUrl: resetUrl
  });
};


export const sendSupportTicketAcknowledgement = async (email: string, ticketId: string) => {
  await sendMailOrLog({
    to: email,
    subject: `PurjiX support request ${ticketId}`,
    html: `<p>We have received your support request.</p><p>Reference ID: <strong>${ticketId}</strong></p><p>Our team will review it shortly.</p>`
  });
};
