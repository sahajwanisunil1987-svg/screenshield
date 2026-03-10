import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.js";
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


export const sendVerificationEmail = async (email: string, verifyUrl: string) => {
  await transporter.sendMail({
    from: env.SMTP_USER,
    to: email,
    subject: "Verify your SpareKart account",
    html: `<p>Verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`
  });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  await transporter.sendMail({
    from: env.SMTP_USER,
    to: email,
    subject: "Reset your SpareKart password",
    html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`
  });
};


export const sendSupportTicketAcknowledgement = async (email: string, ticketId: string) => {
  await transporter.sendMail({
    from: env.SMTP_USER,
    to: email,
    subject: `SpareKart support request ${ticketId}`,
    html: `<p>We have received your support request.</p><p>Reference ID: <strong>${ticketId}</strong></p><p>Our team will review it shortly.</p>`
  });
};
