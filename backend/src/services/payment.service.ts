import crypto from "crypto";
import { PaymentStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
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
