import { Prisma } from "@prisma/client";
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
  const page = Number(_req.query.page ?? 1);
  const limit = Number(_req.query.limit ?? 12);
  const search = String(_req.query.search ?? "").trim();
  const stock = String(_req.query.stock ?? "ALL");

  const where = {
    ...(stock === "LOW" ? { stock: { lte: prisma.inventory.fields.lowStockLimit } } : {}),
    ...(stock === "HEALTHY" ? { stock: { gt: prisma.inventory.fields.lowStockLimit } } : {}),
    ...(search
      ? {
          OR: [
            { warehouseCode: { contains: search, mode: "insensitive" as const } },
            { product: { name: { contains: search, mode: "insensitive" as const } } },
            { product: { sku: { contains: search, mode: "insensitive" as const } } },
            { product: { brand: { name: { contains: search, mode: "insensitive" as const } } } },
            { product: { model: { name: { contains: search, mode: "insensitive" as const } } } },
            { product: { category: { name: { contains: search, mode: "insensitive" as const } } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true,
            model: true,
            category: true
          }
        }
      },
      orderBy: { stock: "asc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.inventory.count({ where })
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

export const updateInventory = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const item = await prisma.inventory.update({
    where: { id },
    data: {
      stock: req.body.stock,
      lowStockLimit: req.body.lowStockLimit,
      warehouseCode: req.body.warehouseCode,
      lastRestockedAt: req.body.lastRestockedAt ? new Date(req.body.lastRestockedAt) : req.body.stock > 0 ? new Date() : undefined
    },
    include: {
      product: {
        include: {
          brand: true,
          model: true,
          category: true
        }
      }
    }
  });

  res.json(item);
};

export const users = async (_req: Request, res: Response) => {
  const page = Number(_req.query.page ?? 1);
  const limit = Number(_req.query.limit ?? 12);
  const search = String(_req.query.search ?? "").trim();
  const activity = String(_req.query.activity ?? "ALL");

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(activity === "WITH_ORDERS" ? { orders: { some: {} } } : {}),
    ...(activity === "WITHOUT_ORDERS" ? { orders: { none: {} } } : {})
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        orders: {
          take: 4,
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.user.count({ where })
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

export const downloadInvoice = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const buffer = await generateInvoicePdfBuffer(id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${id}.pdf`);
  res.send(buffer);
};
