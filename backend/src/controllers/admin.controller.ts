import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { generateInvoicePdfBuffer } from "../services/invoice.service.js";
import { getSingleParam } from "../utils/helpers.js";

export const dashboard = async (_req: Request, res: Response) => {
  const [totalOrders, totalProducts, lowStock, recentOrders, revenueAgg, topProducts, users] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.inventory.findMany({
      where: {
        stock: { lte: 5 }
      },
      include: {
        product: true
      }
    }),
    prisma.order.findMany({
      take: 5,
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, createdAt: true },
      take: 20
    })
  ]);

  res.json({
    stats: {
      totalOrders,
      totalProducts,
      totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
      lowStockCount: lowStock.length
    },
    lowStock,
    recentOrders,
    topProducts,
    users
  });
};

export const inventory = async (_req: Request, res: Response) => {
  const items = await prisma.inventory.findMany({
    include: {
      product: {
        include: {
          brand: true,
          model: true,
          category: true
        }
      }
    },
    orderBy: { stock: "asc" }
  });

  res.json(items);
};

export const users = async (_req: Request, res: Response) => {
  const items = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(items);
};

export const downloadInvoice = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const buffer = await generateInvoicePdfBuffer(id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${id}.pdf`);
  res.send(buffer);
};
