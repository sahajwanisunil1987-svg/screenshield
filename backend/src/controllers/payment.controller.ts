import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { createNotification, sendOrderConfirmation, sendWhatsappNotification } from "../services/notification.service.js";
import {
  cancelAbandonedRazorpayOrder,
  createRazorpayOrder,
  handleRazorpayWebhook,
  verifyRazorpayPayment,
  verifyRazorpayWebhookSignature
} from "../services/payment.service.js";

export const createOrder = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await createRazorpayOrder(req.body.orderId));
};

export const cancelOrder = async (req: Request, res: Response) => {
  res.json(await cancelAbandonedRazorpayOrder(req.body.orderId, req.user!.userId));
};

export const verify = async (req: Request, res: Response) => {
  const result = await verifyRazorpayPayment(req.body);

  if (!result.alreadyProcessed) {
    const order = await prisma.order.findUnique({
      where: { id: result.orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (order?.user) {
      await Promise.allSettled([
        sendOrderConfirmation(order.user.email, order.orderNumber),
        sendWhatsappNotification({ orderNumber: order.orderNumber, user: order.user.name }),
        createNotification({
          userId: order.user.id,
          title: "Order placed",
          message: `Your order ${order.orderNumber} has been placed successfully.`,
          href: "/my-orders",
          kind: "ORDER"
        })
      ]);
    }
  }

  res.json(result);
};

export const webhook = async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  verifyRazorpayWebhookSignature(rawBody, req.header("x-razorpay-signature"));

  const payload = JSON.parse(rawBody.toString("utf8"));
  res.status(StatusCodes.OK).json(await handleRazorpayWebhook(payload));
};
