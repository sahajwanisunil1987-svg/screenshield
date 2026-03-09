import crypto from "crypto";
import { PaymentStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { razorpay } from "../lib/razorpay.js";
import { ApiError } from "../utils/api-error.js";

type OrderWithPayment = Awaited<ReturnType<typeof prisma.order.findUnique>> & {
  payment: NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>["payment"]>;
};

const getOrderWithPayment = async (orderId: string): Promise<OrderWithPayment> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (!order.payment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Payment record not found for order");
  }

  return order as OrderWithPayment;
};

export const createRazorpayOrder = async (orderId: string) => {
  const order = await getOrderWithPayment(orderId);

  if (order.payment.provider === "COD" || order.payment.status === PaymentStatus.COD) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "COD orders do not require Razorpay payment");
  }

  if (order.paymentStatus === PaymentStatus.PAID || order.payment.status === PaymentStatus.PAID) {
    throw new ApiError(StatusCodes.CONFLICT, "Order is already marked as paid");
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
  const order = await getOrderWithPayment(payload.orderId);

  if (order.payment.provider === "COD" || order.payment.status === PaymentStatus.COD) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "COD orders cannot be verified through Razorpay");
  }

  if (order.paymentStatus === PaymentStatus.PAID || order.payment.status === PaymentStatus.PAID) {
    return { verified: true, alreadyProcessed: true };
  }

  if (order.payment.providerOrderId && order.payment.providerOrderId !== payload.razorpayOrderId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Razorpay order does not match the existing payment intent");
  }

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

  return { verified: true, alreadyProcessed: false };
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
