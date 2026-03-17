import crypto from "crypto";
import { Order, OrderStatus, Payment, PaymentStatus, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { razorpay } from "../lib/razorpay.js";
import { ApiError } from "../utils/api-error.js";

type OrderWithPayment = Order & {
  payment: Payment;
};

type PaymentWithOrderItems = Payment & {
  order: Order & {
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
};

const decimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

const consumeInventoryForOrder = async (tx: Prisma.TransactionClient, order: PaymentWithOrderItems["order"]) => {
  for (const item of order.items ?? []) {
    const inventoryUpdate = await tx.inventory.updateMany({
      where: {
        productId: item.productId,
        stock: { gte: item.quantity }
      },
      data: {
        stock: { decrement: item.quantity }
      }
    });

    if (inventoryUpdate.count > 0) {
      continue;
    }

    const productUpdate = await tx.product.updateMany({
      where: {
        id: item.productId,
        stock: { gte: item.quantity }
      },
      data: {
        stock: { decrement: item.quantity }
      }
    });

    if (productUpdate.count === 0) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "One or more items are no longer available in the required quantity. Please contact support for help with this payment."
      );
    }
  }
};

const claimCouponForOrder = async (tx: Prisma.TransactionClient, couponId?: string | null) => {
  if (!couponId) {
    return;
  }

  const coupon = await tx.coupon.findUnique({
    where: { id: couponId },
    select: {
      id: true,
      isActive: true,
      expiresAt: true,
      usageLimit: true,
      usedCount: true
    }
  });

  if (!coupon || !coupon.isActive) {
    throw new ApiError(StatusCodes.CONFLICT, "The coupon attached to this order is no longer valid.");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.CONFLICT, "The coupon attached to this order has expired.");
  }

  const couponUpdate = await tx.coupon.updateMany({
    where: {
      id: coupon.id,
      ...(coupon.usageLimit ? { usedCount: { lt: coupon.usageLimit } } : {})
    },
    data: { usedCount: { increment: 1 } }
  });

  if (couponUpdate.count === 0) {
    throw new ApiError(StatusCodes.CONFLICT, "Coupon usage limit reached before payment could be completed.");
  }
};

const markOnlineOrderPaid = async (
  tx: Prisma.TransactionClient,
  payment: PaymentWithOrderItems,
  payload: {
    providerOrderId: string;
    providerPaymentId?: string;
    providerSignature?: string;
  }
) => {
  if (payment.order.paymentStatus === PaymentStatus.PAID || payment.status === PaymentStatus.PAID) {
    return { verified: true, alreadyProcessed: true, orderId: payment.orderId };
  }

  await consumeInventoryForOrder(tx, payment.order);
  await claimCouponForOrder(tx, payment.order.couponId);

  await tx.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: payment.order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : payment.order.status,
      confirmedAt: payment.order.confirmedAt ?? new Date(),
      payment: {
        update: {
          providerOrderId: payload.providerOrderId,
          providerPaymentId: payload.providerPaymentId,
          providerSignature: payload.providerSignature,
          status: PaymentStatus.PAID
        }
      }
    }
  });

  return { verified: true, alreadyProcessed: false, orderId: payment.orderId };
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

  if (order.status === OrderStatus.CANCELLED) {
    throw new ApiError(StatusCodes.CONFLICT, "Cancelled orders cannot create a Razorpay payment intent");
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

  if (order.status === OrderStatus.CANCELLED) {
    throw new ApiError(StatusCodes.CONFLICT, "Cancelled orders cannot be verified as paid");
  }

  if (order.paymentStatus === PaymentStatus.PAID || order.payment.status === PaymentStatus.PAID) {
    return { verified: true, alreadyProcessed: true, orderId: order.id };
  }

  if (order.payment.providerOrderId && order.payment.providerOrderId !== payload.razorpayOrderId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Razorpay order does not match the existing payment intent");
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== payload.razorpaySignature) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid payment signature");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { orderId: payload.orderId },
      include: {
        order: {
          include: {
            items: {
              select: {
                productId: true,
                quantity: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
    }

    if (payment.provider === "COD" || payment.status === PaymentStatus.COD) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "COD orders cannot be verified through Razorpay");
    }

    if (payment.order.status === OrderStatus.CANCELLED) {
      throw new ApiError(StatusCodes.CONFLICT, "Cancelled orders cannot be verified as paid");
    }

    if (payment.providerOrderId && payment.providerOrderId !== payload.razorpayOrderId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Razorpay order does not match the existing payment intent");
    }

    return markOnlineOrderPaid(tx, payment as PaymentWithOrderItems, {
      providerOrderId: payload.razorpayOrderId,
      providerPaymentId: payload.razorpayPaymentId,
      providerSignature: payload.razorpaySignature
    });
  });
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
) =>
  prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        OR: [{ providerOrderId }, ...(providerPaymentId ? [{ providerPaymentId }] : [])]
      },
      include: {
        order: {
          include: {
            items: {
              select: {
                productId: true,
                quantity: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return { updated: false, reason: "payment_not_found" };
    }

    if (payment.provider === "COD" || payment.status === PaymentStatus.COD) {
      return { updated: false, reason: "cod_order" };
    }

    if (payment.order.status === OrderStatus.CANCELLED) {
      return { updated: false, reason: "cancelled_order" };
    }

    if (nextStatus === PaymentStatus.FAILED && (payment.order.paymentStatus === PaymentStatus.PAID || payment.status === PaymentStatus.PAID)) {
      return { updated: false, reason: "already_paid", orderId: payment.orderId };
    }

    if (nextStatus === PaymentStatus.PAID) {
      return {
        updated: true,
        ...(await markOnlineOrderPaid(tx, payment as PaymentWithOrderItems, {
          providerOrderId,
          providerPaymentId
        }))
      };
    }

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: nextStatus,
        payment: {
          update: {
            providerOrderId,
            providerPaymentId,
            status: nextStatus
          }
        }
      }
    });

    return { updated: true, orderId: payment.orderId, alreadyProcessed: false };
  });

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
