import crypto from "crypto";
import { PaymentStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { razorpay } from "../lib/razorpay.js";
import { ApiError } from "../utils/api-error.js";

export const createRazorpayOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  const createdOrder = await razorpay.orders.create({
    amount: Math.round(Number(order.totalAmount) * 100),
    currency: "INR",
    receipt: order.orderNumber
  });

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      providerOrderId: createdOrder.id
    }
  });

  return createdOrder;
};

export const verifyRazorpayPayment = async (payload: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== payload.razorpaySignature) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid payment signature");
  }

  await prisma.order.update({
    where: { id: payload.orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: "CONFIRMED",
      payment: {
        update: {
          providerOrderId: payload.razorpayOrderId,
          providerPaymentId: payload.razorpayPaymentId,
          providerSignature: payload.razorpaySignature,
          status: PaymentStatus.PAID
        }
      }
    }
  });

  return { verified: true };
};

export const verifyRazorpayWebhookSignature = (rawBody: Buffer, signature?: string) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "Razorpay webhook secret is not configured");
  }

  if (!signature) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Missing Razorpay signature");
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Razorpay webhook signature");
  }
};

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
};

const upsertPaymentStatusFromWebhook = async (
  providerOrderId: string,
  providerPaymentId: string | undefined,
  nextStatus: PaymentStatus
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ providerOrderId }, ...(providerPaymentId ? [{ providerPaymentId }] : [])]
    },
    include: {
      order: true
    }
  });

  if (!payment) {
    return { updated: false, reason: "payment_not_found" };
  }

  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: nextStatus,
      status: nextStatus === PaymentStatus.PAID ? "CONFIRMED" : payment.order.status,
      payment: {
        update: {
          providerOrderId,
          providerPaymentId,
          status: nextStatus
        }
      }
    }
  });

  return { updated: true, orderId: payment.orderId };
};

export const handleRazorpayWebhook = async (payload: RazorpayWebhookPayload) => {
  const providerOrderId = payload.payload?.payment?.entity?.order_id;
  const providerPaymentId = payload.payload?.payment?.entity?.id;

  if (!providerOrderId) {
    return {
      received: true,
      handled: false,
      event: payload.event,
      reason: "missing_provider_order_id"
    };
  }

  if (payload.event === "payment.captured" || payload.event === "order.paid") {
    return {
      received: true,
      handled: true,
      event: payload.event,
      ...(await upsertPaymentStatusFromWebhook(providerOrderId, providerPaymentId, PaymentStatus.PAID))
    };
  }

  if (payload.event === "payment.failed") {
    return {
      received: true,
      handled: true,
      event: payload.event,
      ...(await upsertPaymentStatusFromWebhook(providerOrderId, providerPaymentId, PaymentStatus.FAILED))
    };
  }

  return {
    received: true,
    handled: false,
    event: payload.event,
    reason: "ignored_event"
  };
};
