import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { generateInvoicePdfBuffer } from "../services/invoice.service.js";
import { getSingleParam } from "../utils/helpers.js";

const rangeDaysMap = {
  "7d": 7,
  "30d": 30,
  "90d": 90
} as const;

export const dashboard = async (req: Request, res: Response) => {
  const range = String(req.query.range ?? "30d") as keyof typeof rangeDaysMap;
  const days = rangeDaysMap[range] ?? 30;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const netSalesWhere: Prisma.OrderWhereInput = {
    createdAt: { gte: rangeStart },
    status: { not: "CANCELLED" },
    OR: [{ returnRequestStatus: null }, { returnRequestStatus: { not: "APPROVED" } }]
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    totalProducts,
    lowStock,
    recentOrders,
    revenueAgg,
    topProducts,
    users,
    rangedOrders,
    rangedCustomers,
    pendingCancelApprovals,
    pendingReturnApprovals,
    awaitingPacking,
    awaitingShipment,
    deliveredToday
  ] = await Promise.all([
    prisma.order.count({
      where: netSalesWhere
    }),
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
      where: {
        createdAt: { gte: rangeStart }
      },
      take: 5,
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.aggregate({
      where: netSalesWhere,
      _sum: {
        totalAmount: true
      }
    }),
    prisma.orderItem.findMany({
      where: {
        order: netSalesWhere
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
            model: { select: { name: true } }
          }
        }
      }
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, createdAt: true },
      take: 20
    }),
    prisma.order.findMany({
      where: netSalesWhere,
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        userId: true
      }
    }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: rangeStart }
      }
    }),
    prisma.order.count({
      where: {
        cancelRequestStatus: "PENDING"
      }
    }),
    prisma.order.count({
      where: {
        returnRequestStatus: "PENDING"
      }
    }),
    prisma.order.count({
      where: {
        status: "CONFIRMED"
      }
    }),
    prisma.order.count({
      where: {
        status: "PACKED"
      }
    }),
    prisma.order.count({
      where: {
        status: "DELIVERED",
        updatedAt: { gte: todayStart }
      }
    })
  ]);

  const trend = Array.from({ length: days }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      orders: 0,
      revenue: 0
    };
  });

  for (const order of rangedOrders) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    const bucket = trend.find((entry) => entry.date === key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += Number(order.totalAmount ?? 0);
  }

  const salesByProduct = new Map<string, { productId: string; productName: string; quantity: number }>();
  const salesByBrand = new Map<string, number>();
  const salesByCategory = new Map<string, number>();
  const salesByModel = new Map<string, number>();

  for (const item of topProducts) {
    const quantity = item.quantity;
    const productName = item.product.name;
    const existing = salesByProduct.get(item.productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      salesByProduct.set(item.productId, {
        productId: item.productId,
        productName,
        quantity
      });
    }

    salesByBrand.set(item.product.brand.name, (salesByBrand.get(item.product.brand.name) ?? 0) + quantity);
    salesByCategory.set(item.product.category.name, (salesByCategory.get(item.product.category.name) ?? 0) + quantity);
    salesByModel.set(item.product.model.name, (salesByModel.get(item.product.model.name) ?? 0) + quantity);
  }

  const topBrand = Array.from(salesByBrand.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));
  const topCategory = Array.from(salesByCategory.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));
  const topModel = Array.from(salesByModel.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  const fulfilledOrders = rangedOrders.filter((order) => ["SHIPPED", "DELIVERED"].includes(order.status)).length;

  res.json({
    range,
    rangeStart,
    stats: {
      totalOrders,
      totalProducts,
      totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
      lowStockCount: lowStock.length,
      newCustomers: rangedCustomers,
      fulfilledOrders,
      pendingCancelApprovals,
      pendingReturnApprovals,
      awaitingPacking,
      awaitingShipment,
      deliveredToday,
      averageOrderValue: totalOrders ? Number(revenueAgg._sum.totalAmount ?? 0) / totalOrders : 0
    },
    lowStock,
    recentOrders,
    topProducts: Array.from(salesByProduct.values())
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5),
    topBrands: topBrand,
    topCategories: topCategory,
    topModels: topModel,
    trend,
    users
  });
};

export const inventory = async (_req: Request, res: Response) => {
  const page = Number(_req.query.page ?? 1);
  const limit = Number(_req.query.limit ?? 12);
  const search = String(_req.query.search ?? "").trim();
  const stock = String(_req.query.stock ?? "ALL");

  const baseWhere = {
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

  const where = {
    ...baseWhere,
    ...(stock === "CRITICAL" ? { stock: { lte: 2 } } : {}),
    ...(stock === "LOW" ? { stock: { lte: prisma.inventory.fields.lowStockLimit } } : {}),
    ...(stock === "HEALTHY" ? { stock: { gt: prisma.inventory.fields.lowStockLimit } } : {})
  };

  const [items, total, allMatching] = await Promise.all([
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
      orderBy: [{ stock: "asc" }, { updatedAt: "asc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where: baseWhere,
      select: {
        stock: true,
        lowStockLimit: true
      }
    })
  ]);

  const summary = allMatching.reduce(
    (acc, item) => {
      const reorderTo = Math.max(item.lowStockLimit * 3, 12);
      const reorderQty = Math.max(reorderTo - item.stock, 0);
      acc.totalUnits += item.stock;
      acc.reorderUnits += reorderQty;

      if (item.stock <= 2) {
        acc.critical += 1;
      }

      if (item.stock <= item.lowStockLimit) {
        acc.low += 1;
      } else {
        acc.healthy += 1;
      }

      return acc;
    },
    { critical: 0, low: 0, healthy: 0, totalUnits: 0, reorderUnits: 0 }
  );

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    summary
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


export const userDetail = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const user = await prisma.user.findFirst({
    where: {
      id,
      role: "CUSTOMER"
    },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
      },
      orders: {
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              productName: true,
              productSku: true,
              totalPrice: true
            }
          }
        }
      },
      _count: {
        select: {
          orders: true,
          addresses: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);
  const lastOrderAt = user.orders[0]?.createdAt ?? null;

  res.json({
    ...user,
    stats: {
      totalOrders: user._count.orders,
      totalAddresses: user._count.addresses,
      totalSpent,
      averageOrderValue: user._count.orders ? totalSpent / user._count.orders : 0,
      lastOrderAt
    }
  });
};

export const invoices = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "ALL");

  const where: Prisma.InvoiceWhereInput = {
    ...(status === "GENERATED" ? { generatedAt: { not: null } } : {}),
    ...(status === "PENDING" ? { generatedAt: null } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" } },
            { billingName: { contains: search, mode: "insensitive" } },
            { billingEmail: { contains: search, mode: "insensitive" } },
            { order: { orderNumber: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentStatus: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.invoice.count({ where })
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
  await prisma.invoice.update({
    where: { orderId: id },
    data: {
      lastDownloadedAt: new Date(),
      downloadCount: { increment: 1 }
    }
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${id}.pdf`);
  res.send(buffer);
};
