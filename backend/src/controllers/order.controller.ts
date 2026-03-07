import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { sendOrderConfirmation, sendWhatsappNotification } from "../services/notification.service.js";
import * as orderService from "../services/order.service.js";
import { getSingleParam } from "../utils/helpers.js";

export const createOrder = async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.userId, req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (user) {
    await Promise.allSettled([
      sendOrderConfirmation(user.email, order.orderNumber),
      sendWhatsappNotification({ orderNumber: order.orderNumber, user: user.name })
    ]);
  }

  res.status(StatusCodes.CREATED).json(order);
};

export const myOrders = async (req: Request, res: Response) => {
  res.json(await orderService.getUserOrders(req.user!.userId));
};

export const getOrder = async (req: Request, res: Response) => {
  res.json(
    await orderService.getOrderById(
      getSingleParam(req.params.id)!,
      req.user!.userId,
      req.user!.role === "ADMIN"
    )
  );
};

export const trackOrder = async (req: Request, res: Response) => {
  res.json(await orderService.trackOrder(getSingleParam(req.params.orderNumber)!));
};

export const validateCoupon = async (req: Request, res: Response) => {
  res.json(await orderService.validateCoupon(req.body.code, req.body.subtotal));
};

export const adminOrders = async (_req: Request, res: Response) => {
  res.json(await orderService.adminOrders());
};

export const updateStatus = async (req: Request, res: Response) => {
  res.json(await orderService.updateOrderStatus(getSingleParam(req.params.id)!, req.body));
};

export const adminCoupons = async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  });

  res.json(coupons);
};

export const createCoupon = async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.create({
    data: {
      ...req.body,
      code: req.body.code.toUpperCase(),
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    }
  });

  res.status(StatusCodes.CREATED).json(coupon);
};
