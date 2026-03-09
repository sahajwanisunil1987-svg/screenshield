import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { generateInvoicePdfBuffer } from "../services/invoice.service.js";
import { createNotification, sendOrderConfirmation, sendWhatsappNotification } from "../services/notification.service.js";
import * as orderService from "../services/order.service.js";
import { getSingleParam } from "../utils/helpers.js";

export const createOrder = async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.userId, req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (user) {
    await Promise.allSettled([
      sendOrderConfirmation(user.email, order.orderNumber),
      sendWhatsappNotification({ orderNumber: order.orderNumber, user: user.name }),
      createNotification({
        userId: req.user!.userId,
        title: "Order placed",
        message: `Your order ${order.orderNumber} has been placed successfully.`,
        href: `/my-orders`,
        kind: "ORDER"
      })
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

export const cancelRequest = async (req: Request, res: Response) => {
  const order = await orderService.requestOrderCancellation(getSingleParam(req.params.id)!, req.user!.userId, req.body.reason);
  await createNotification({
    userId: req.user!.userId,
    title: "Cancellation requested",
    message: `We have received your cancellation request for order ${order.orderNumber}.`,
    href: `/my-orders`,
    kind: "ORDER"
  });
  res.json(order);
};

export const returnRequest = async (req: Request, res: Response) => {
  const order = await orderService.requestReturn(getSingleParam(req.params.id)!, req.user!.userId, req.body.reason);
  await createNotification({
    userId: req.user!.userId,
    title: "Return requested",
    message: `We have received your return request for order ${order.orderNumber}.`,
    href: `/my-orders`,
    kind: "ORDER"
  });
  res.json(order);
};


export const reviewCancelRequest = async (req: Request, res: Response) => {
  const order = await orderService.reviewCancelRequest(getSingleParam(req.params.id)!, req.body.action, req.body.note);
  if (order.user?.id) {
    await createNotification({
      userId: order.user.id,
      title: req.body.action === "APPROVE" ? "Cancellation approved" : "Cancellation declined",
      message:
        req.body.action === "APPROVE"
          ? `Your cancellation request for ${order.orderNumber} has been approved.`
          : `Your cancellation request for ${order.orderNumber} has been declined.`,
      href: `/my-orders`,
      kind: "ORDER"
    });
  }
  res.json(order);
};

export const reviewReturnRequest = async (req: Request, res: Response) => {
  const order = await orderService.reviewReturnRequest(getSingleParam(req.params.id)!, req.body.action, req.body.note);
  if (order.user?.id) {
    await createNotification({
      userId: order.user.id,
      title: req.body.action === "APPROVE" ? "Return approved" : "Return declined",
      message:
        req.body.action === "APPROVE"
          ? `Your return request for ${order.orderNumber} has been approved.`
          : `Your return request for ${order.orderNumber} has been declined.`,
      href: `/my-orders`,
      kind: "ORDER"
    });
  }
  res.json(order);
};

export const downloadMyInvoice = async (req: Request, res: Response) => {
  const orderId = getSingleParam(req.params.id)!;
  const order = await orderService.getOrderById(orderId, req.user!.userId, false);

  if (!order.invoice) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Invoice not found" });
  }

  const buffer = await generateInvoicePdfBuffer(orderId);
  await prisma.invoice.update({
    where: { orderId },
    data: {
      lastDownloadedAt: new Date(),
      downloadCount: { increment: 1 }
    }
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  res.send(buffer);
};

export const trackOrder = async (req: Request, res: Response) => {
  res.json(await orderService.trackOrder(getSingleParam(req.params.orderNumber)!));
};

export const validateCoupon = async (req: Request, res: Response) => {
  res.json(await orderService.validateCoupon(req.body.code, req.body.subtotal));
};

export const adminOrders = async (req: Request, res: Response) => {
  res.json(await orderService.adminOrders(req.query));
};

export const updateStatus = async (req: Request, res: Response) => {
  const order = await orderService.updateOrderStatus(getSingleParam(req.params.id)!, req.body);
  if (order.user?.id) {
    await createNotification({
      userId: order.user.id,
      title: `Order ${order.status.toLowerCase()}`,
      message: `Order ${order.orderNumber} is now ${order.status.toLowerCase()}.`,
      href: `/track-order?orderNumber=${order.orderNumber}`,
      kind: "ORDER"
    });
  }
  res.json(order);
};

export const adminCoupons = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "ALL");
  const type = String(req.query.type ?? "ALL");

  const where: Prisma.CouponWhereInput = {
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(status === "ACTIVE" ? { isActive: true } : {}),
    ...(status === "INACTIVE" ? { isActive: false } : {}),
    ...(type !== "ALL" ? { type: type as "PERCENTAGE" | "FLAT" } : {})
  };

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.coupon.count({ where })
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
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

export const updateCoupon = async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.update({
    where: { id: getSingleParam(req.params.id)! },
    data: {
      ...req.body,
      code: req.body.code.toUpperCase(),
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null
    }
  });

  res.json(coupon);
};

export const deleteCoupon = async (req: Request, res: Response) => {
  await prisma.coupon.delete({
    where: { id: getSingleParam(req.params.id)! }
  });

  res.status(StatusCodes.NO_CONTENT).send();
};
