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

const APP_SETTINGS_ID = "default";

export const appSettings = async (_req: Request, res: Response) => {
  const settings = await prisma.appSetting.upsert({
    where: { id: APP_SETTINGS_ID },
    update: {},
    create: { id: APP_SETTINGS_ID }
  });

  res.json(settings);
};

export const updateAppSettings = async (req: Request, res: Response) => {
  const settings = await prisma.appSetting.upsert({
    where: { id: APP_SETTINGS_ID },
    update: req.body,
    create: {
      id: APP_SETTINGS_ID,
      ...req.body
    }
  });

  res.json(settings);
};

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


export const accounting = async (req: Request, res: Response) => {
  const range = String(req.query.range ?? "30d") as keyof typeof rangeDaysMap;
  const days = rangeDaysMap[range] ?? 30;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: rangeStart } },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      discountAmount: true,
      shippingAmount: true,
      taxAmount: true,
      totalAmount: true,
      refundAmount: true,
      refundReason: true,
      refundedAt: true,
      cancelRequestReason: true,
      cancelRequestStatus: true,
      returnRequestReason: true,
      returnRequestStatus: true,
      returnDecisionNote: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          productName: true,
          productSku: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const productIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.productId))));
  const purchaseEntries = productIds.length
    ? await prisma.purchaseEntry.findMany({
        where: { productId: { in: productIds } },
        select: {
          productId: true,
          unitCost: true,
          purchasedAt: true
        },
        orderBy: [{ productId: "asc" }, { purchasedAt: "desc" }]
      })
    : [];

  const latestUnitCostByProduct = new Map<string, number>();
  for (const entry of purchaseEntries) {
    if (!latestUnitCostByProduct.has(entry.productId)) {
      latestUnitCostByProduct.set(entry.productId, Number(entry.unitCost));
    }
  }

  const marginByProduct = new Map<string, {
    productId: string;
    productName: string;
    productSku: string;
    revenue: number;
    cost: number;
    grossProfit: number;
    units: number;
  }>();
  const returnByProduct = new Map<string, {
    productId: string;
    productName: string;
    productSku: string;
    requests: number;
    approvedReturns: number;
    refundedAmount: number;
  }>();
  const reasonBuckets = {
    cancellation: new Map<string, { reason: string; count: number; refundAmount: number }>(),
    return: new Map<string, { reason: string; count: number; refundAmount: number }>(),
    refund: new Map<string, { reason: string; count: number; refundAmount: number }>()
  };

  const addReason = (bucket: Map<string, { reason: string; count: number; refundAmount: number }>, reason: string | null | undefined, refundAmount: number) => {
    const normalized = (reason ?? "Unspecified").trim() || "Unspecified";
    const existing = bucket.get(normalized) ?? { reason: normalized, count: 0, refundAmount: 0 };
    existing.count += 1;
    existing.refundAmount += refundAmount;
    bucket.set(normalized, existing);
  };

  const reportOrders = orders.map((order) => {
    const subtotal = Number(order.subtotal ?? 0);
    const discountAmount = Number(order.discountAmount ?? 0);
    const shippingAmount = Number(order.shippingAmount ?? 0);
    const taxAmount = Number(order.taxAmount ?? 0);
    const totalAmount = Number(order.totalAmount ?? 0);
    const refundAmount = Number(order.refundAmount ?? 0);
    const isCancelled = order.status === "CANCELLED";
    const isReturned = order.returnRequestStatus === "APPROVED";
    const isNetOrder = !isCancelled && !isReturned;
    const isRefunded = order.paymentStatus === "REFUNDED";
    const isPrepaid = ["PAID", "PENDING", "REFUNDED", "FAILED"].includes(order.paymentStatus);

    const estimatedCost = order.items.reduce((sum, item) => sum + (latestUnitCostByProduct.get(item.productId) ?? 0) * item.quantity, 0);
    const grossProfit = isNetOrder ? totalAmount - estimatedCost : 0;
    const marginPercent = isNetOrder && totalAmount > 0 ? (grossProfit / totalAmount) * 100 : 0;

    if (isNetOrder) {
      const totalUnits = Math.max(order.items.reduce((qty, current) => qty + current.quantity, 0), 1);
      for (const item of order.items) {
        const unitCost = latestUnitCostByProduct.get(item.productId) ?? 0;
        const itemCost = unitCost * item.quantity;
        const existing = marginByProduct.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
          units: 0
        };
        const allocatedRevenue = totalAmount * (item.quantity / totalUnits);
        existing.revenue += allocatedRevenue;
        existing.cost += itemCost;
        existing.grossProfit = existing.revenue - existing.cost;
        existing.units += item.quantity;
        marginByProduct.set(item.productId, existing);
      }
    }

    if (order.returnRequestReason || order.returnRequestStatus) {
      addReason(reasonBuckets.return, order.returnRequestReason ?? order.returnDecisionNote, refundAmount);
    }

    if (order.cancelRequestReason || order.cancelRequestStatus) {
      addReason(reasonBuckets.cancellation, order.cancelRequestReason, refundAmount);
    }

    if (isRefunded || refundAmount > 0) {
      addReason(reasonBuckets.refund, order.refundReason ?? order.returnRequestReason ?? order.cancelRequestReason, refundAmount || totalAmount);
    }

    if (order.returnRequestStatus) {
      for (const item of order.items) {
        const existing = returnByProduct.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          requests: 0,
          approvedReturns: 0,
          refundedAmount: 0
        };
        if (order.returnRequestStatus === "PENDING" || order.returnRequestStatus === "APPROVED") {
          existing.requests += item.quantity;
        }
        if (order.returnRequestStatus === "APPROVED") {
          existing.approvedReturns += item.quantity;
          existing.refundedAmount += refundAmount || totalAmount;
        }
        returnByProduct.set(item.productId, existing);
      }
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.user?.name ?? "Customer",
      customerEmail: order.user?.email ?? null,
      subtotal,
      discountAmount,
      shippingAmount,
      taxAmount,
      totalAmount,
      refundAmount,
      refundReason: order.refundReason,
      estimatedCost,
      grossProfit,
      marginPercent,
      cancelRequestStatus: order.cancelRequestStatus,
      cancelRequestReason: order.cancelRequestReason,
      returnRequestStatus: order.returnRequestStatus,
      returnRequestReason: order.returnRequestReason,
      isCancelled,
      isReturned,
      isNetOrder,
      isRefunded,
      isPrepaid
    };
  });

  const summary = reportOrders.reduce((acc, order) => {
    acc.grossSales += order.subtotal;
    acc.discounts += order.discountAmount;
    acc.shippingCollected += order.shippingAmount;
    acc.taxCollected += order.taxAmount;

    if (order.isNetOrder) {
      acc.netSales += order.totalAmount;
      acc.netOrders += 1;
      acc.costOfGoods += order.estimatedCost;
      acc.grossProfit += order.grossProfit;
    }

    if (order.isCancelled) {
      acc.cancelledOrders += 1;
      acc.cancelledValue += order.totalAmount;
      acc.cancellationRefunds += order.refundAmount;
    }

    if (order.isReturned) {
      acc.returnedOrders += 1;
      acc.returnedValue += order.totalAmount;
      acc.returnRefunds += order.refundAmount;
    }

    if (order.isRefunded) {
      acc.refundedValue += order.refundAmount || order.totalAmount;
      acc.refundOutflow += order.refundAmount || order.totalAmount;
    }

    if (order.paymentStatus === "COD") {
      acc.codOrders += 1;
      if (order.isNetOrder) acc.codValue += order.totalAmount;
    }

    if (order.isPrepaid) {
      acc.prepaidOrders += 1;
      if (order.isNetOrder && order.paymentStatus === "PAID") acc.prepaidValue += order.totalAmount;
      if (order.paymentStatus === "PENDING") acc.pendingPaymentValue += order.totalAmount;
    }

    return acc;
  }, {
    grossSales: 0,
    netSales: 0,
    discounts: 0,
    shippingCollected: 0,
    taxCollected: 0,
    netOrders: 0,
    cancelledOrders: 0,
    cancelledValue: 0,
    returnedOrders: 0,
    returnedValue: 0,
    refundedValue: 0,
    refundOutflow: 0,
    cancellationRefunds: 0,
    returnRefunds: 0,
    codOrders: 0,
    codValue: 0,
    prepaidOrders: 0,
    prepaidValue: 0,
    pendingPaymentValue: 0,
    costOfGoods: 0,
    grossProfit: 0
  });

  const summaryWithDerived = {
    ...summary,
    taxableValue: Math.max(summary.netSales - summary.shippingCollected - summary.taxCollected, 0),
    cgstCollected: summary.taxCollected / 2,
    sgstCollected: summary.taxCollected / 2,
    averageNetOrderValue: summary.netOrders ? summary.netSales / summary.netOrders : 0,
    grossMarginPercent: summary.netSales ? (summary.grossProfit / summary.netSales) * 100 : 0
  };

  const dailyBreakdownMap = new Map<string, {
    date: string;
    label: string;
    grossSales: number;
    netSales: number;
    taxCollected: number;
    orders: number;
    refunds: number;
    costOfGoods: number;
    grossProfit: number;
  }>();

  for (const order of reportOrders) {
    const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);
    const existing = dailyBreakdownMap.get(dateKey) ?? {
      date: dateKey,
      label: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      grossSales: 0,
      netSales: 0,
      taxCollected: 0,
      orders: 0,
      refunds: 0,
      costOfGoods: 0,
      grossProfit: 0
    };

    existing.grossSales += order.subtotal;
    existing.taxCollected += order.taxAmount;
    existing.orders += 1;
    if (order.isNetOrder) {
      existing.netSales += order.totalAmount;
      existing.costOfGoods += order.estimatedCost;
      existing.grossProfit += order.grossProfit;
    }
    if (order.isRefunded) existing.refunds += order.refundAmount || order.totalAmount;
    dailyBreakdownMap.set(dateKey, existing);
  }

  const topMarginProducts = Array.from(marginByProduct.values())
    .sort((left, right) => right.grossProfit - left.grossProfit)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      marginPercent: item.revenue ? (item.grossProfit / item.revenue) * 100 : 0
    }));

  const lowMarginOrders = reportOrders
    .filter((order) => order.isNetOrder && order.marginPercent <= 15)
    .sort((left, right) => left.marginPercent - right.marginPercent)
    .slice(0, 5);

  const topReturnProducts = Array.from(returnByProduct.values())
    .sort((left, right) => right.approvedReturns - left.approvedReturns || right.requests - left.requests)
    .slice(0, 5);

  const reasonAnalytics = {
    cancellation: Array.from(reasonBuckets.cancellation.values()).sort((a, b) => b.count - a.count || b.refundAmount - a.refundAmount).slice(0, 5),
    return: Array.from(reasonBuckets.return.values()).sort((a, b) => b.count - a.count || b.refundAmount - a.refundAmount).slice(0, 5),
    refund: Array.from(reasonBuckets.refund.values()).sort((a, b) => b.refundAmount - a.refundAmount || b.count - a.count).slice(0, 5)
  };

  res.json({
    range,
    rangeStart,
    summary: summaryWithDerived,
    dailyBreakdown: Array.from(dailyBreakdownMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
    topMarginProducts,
    topReturnProducts,
    reasonAnalytics,
    lowMarginOrders,
    reportOrders
  });
};

export const exportAccounting = async (req: Request, res: Response) => {
  const range = String(req.query.range ?? "30d") as keyof typeof rangeDaysMap;
  const days = rangeDaysMap[range] ?? 30;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: rangeStart } },
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      discountAmount: true,
      shippingAmount: true,
      taxAmount: true,
      totalAmount: true,
      refundAmount: true,
      refundReason: true,
      returnRequestStatus: true,
      items: {
        select: {
          productId: true,
          quantity: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const productIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.productId))));
  const purchaseEntries = productIds.length
    ? await prisma.purchaseEntry.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, unitCost: true, purchasedAt: true },
        orderBy: [{ productId: "asc" }, { purchasedAt: "desc" }]
      })
    : [];

  const latestUnitCostByProduct = new Map<string, number>();
  for (const entry of purchaseEntries) {
    if (!latestUnitCostByProduct.has(entry.productId)) {
      latestUnitCostByProduct.set(entry.productId, Number(entry.unitCost));
    }
  }

  const escape = (value: string | number | null | undefined) => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const rows = [
    [
      'Order Number',
      'Created At',
      'Customer Name',
      'Customer Email',
      'Order Status',
      'Payment Status',
      'Return Status',
      'Subtotal',
      'Discount',
      'Shipping',
      'GST',
      'Total',
      'Estimated Cost',
      'Gross Profit',
      'Margin %',
      'Refund Amount',
      'Refund Reason',
      'Net Order'
    ],
    ...orders.map((order) => {
      const isNetOrder = order.status !== 'CANCELLED' && order.returnRequestStatus !== 'APPROVED';
      const estimatedCost = order.items.reduce((sum, item) => sum + (latestUnitCostByProduct.get(item.productId) ?? 0) * item.quantity, 0);
      const totalAmount = Number(order.totalAmount ?? 0);
      const grossProfit = isNetOrder ? totalAmount - estimatedCost : 0;
      const marginPercent = isNetOrder && totalAmount > 0 ? (grossProfit / totalAmount) * 100 : 0;
      const refundAmount = Number(order.refundAmount ?? 0);
      return [
        order.orderNumber,
        order.createdAt.toISOString(),
        order.user?.name ?? 'Customer',
        order.user?.email ?? '',
        order.status,
        order.paymentStatus,
        order.returnRequestStatus ?? '',
        Number(order.subtotal ?? 0).toFixed(2),
        Number(order.discountAmount ?? 0).toFixed(2),
        Number(order.shippingAmount ?? 0).toFixed(2),
        Number(order.taxAmount ?? 0).toFixed(2),
        totalAmount.toFixed(2),
        estimatedCost.toFixed(2),
        grossProfit.toFixed(2),
        marginPercent.toFixed(2),
        refundAmount.toFixed(2),
        order.refundReason ?? '',
        isNetOrder ? 'YES' : 'NO'
      ];
    })
  ];

  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="accounting-${range}.csv"`);
  res.status(200).send(csv);
};

export const purchases = async (req: Request, res: Response) => {
  const range = String(req.query.range ?? "30d") as keyof typeof rangeDaysMap;
  const days = rangeDaysMap[range] ?? 30;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  const vendorId = typeof req.query.vendorId === "string" ? req.query.vendorId : undefined;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const where = {
    purchasedAt: { gte: rangeStart },
    ...(vendorId ? { vendorId } : {})
  };

  const [vendors, entries, total, aggregate, allPurchaseEntries, inventoryItems, soldItems] = await Promise.all([
    prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.purchaseEntry.findMany({
      where,
      include: {
        vendor: true,
        product: {
          include: {
            brand: true,
            model: true,
            category: true,
            inventory: true
          }
        }
      },
      orderBy: { purchasedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.purchaseEntry.count({ where }),
    prisma.purchaseEntry.aggregate({ where, _sum: { totalCost: true, quantity: true } }),
    prisma.purchaseEntry.findMany({
      where,
      select: {
        vendorId: true,
        totalCost: true,
        quantity: true,
        vendor: { select: { id: true, name: true } },
        productId: true,
        unitCost: true,
        purchasedAt: true
      },
      orderBy: [{ productId: 'asc' }, { purchasedAt: 'desc' }]
    }),
    prisma.inventory.findMany({
      include: {
        product: {
          include: {
            brand: true,
            model: true,
            category: true
          }
        }
      }
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: rangeStart },
          status: { not: "CANCELLED" },
          OR: [{ returnRequestStatus: null }, { returnRequestStatus: { not: "APPROVED" } }]
        }
      },
      select: {
        productId: true,
        quantity: true
      }
    })
  ]);

  const latestUnitCostByProduct = new Map<string, number>();
  for (const entry of allPurchaseEntries) {
    if (!latestUnitCostByProduct.has(entry.productId)) {
      latestUnitCostByProduct.set(entry.productId, Number(entry.unitCost));
    }
  }

  const vendorSpendMap = new Map<string, { vendorId: string; vendorName: string; spend: number; units: number }>();
  for (const entry of allPurchaseEntries) {
    const current = vendorSpendMap.get(entry.vendorId) ?? {
      vendorId: entry.vendor.id,
      vendorName: entry.vendor.name,
      spend: 0,
      units: 0
    };
    current.spend += Number(entry.totalCost);
    current.units += entry.quantity;
    vendorSpendMap.set(entry.vendorId, current);
  }

  const soldUnitsByProduct = new Map<string, number>();
  for (const item of soldItems) {
    soldUnitsByProduct.set(item.productId, (soldUnitsByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  let inventoryValue = 0;
  const stockInsights = inventoryItems
    .map((item) => {
      const latestUnitCost = latestUnitCostByProduct.get(item.productId) ?? 0;
      const estimatedValue = latestUnitCost * item.stock;
      inventoryValue += estimatedValue;
      const soldUnits = soldUnitsByProduct.get(item.productId) ?? 0;
      return {
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        stock: item.stock,
        lowStockLimit: item.lowStockLimit,
        latestUnitCost,
        estimatedValue,
        soldUnits,
        isLowStock: item.stock <= item.lowStockLimit,
        isDeadStock: item.stock > 0 && soldUnits === 0,
        isSlowMoving: item.stock > 0 && soldUnits > 0 && soldUnits <= 2,
        brandName: item.product.brand.name,
        modelName: item.product.model.name
      };
    })
    .sort((left, right) => right.estimatedValue - left.estimatedValue)
    .slice(0, 5);

  const topVendors = Array.from(vendorSpendMap.values())
    .sort((left, right) => right.spend - left.spend)
    .slice(0, 5);

  const deadStockItems = stockInsights
    .filter((item) => item.isDeadStock)
    .sort((left, right) => right.estimatedValue - left.estimatedValue)
    .slice(0, 5);

  const slowMovingItems = stockInsights
    .filter((item) => item.isSlowMoving)
    .sort((left, right) => right.estimatedValue - left.estimatedValue)
    .slice(0, 5);

  res.json({
    range,
    vendors,
    items: entries.map((entry) => ({
      id: entry.id,
      quantity: entry.quantity,
      unitCost: Number(entry.unitCost),
      totalCost: Number(entry.totalCost),
      invoiceRef: entry.invoiceRef,
      notes: entry.notes,
      purchasedAt: entry.purchasedAt,
      vendor: entry.vendor,
      product: entry.product
    })),
    summary: {
      totalSpend: Number(aggregate._sum.totalCost ?? 0),
      totalUnits: Number(aggregate._sum.quantity ?? 0),
      activeVendors: vendors.length,
      averageUnitCost: Number(aggregate._sum.quantity ?? 0)
        ? Number(aggregate._sum.totalCost ?? 0) / Number(aggregate._sum.quantity ?? 0)
        : 0,
      inventoryValue,
      lowStockItems: inventoryItems.filter((item) => item.stock <= item.lowStockLimit).length,
      deadStockItems: stockInsights.filter((item) => item.isDeadStock).length,
      slowMovingItems: stockInsights.filter((item) => item.isSlowMoving).length
    },
    topVendors,
    stockInsights,
    deadStockItems,
    slowMovingItems,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit))
    }
  });
};

export const createVendor = async (req: Request, res: Response) => {
  const vendor = await prisma.vendor.create({
    data: {
      name: req.body.name,
      contactName: req.body.contactName || null,
      email: req.body.email || null,
      phone: req.body.phone || null,
      gstin: req.body.gstin || null,
      address: req.body.address || null,
      isActive: req.body.isActive ?? true
    }
  });

  res.status(201).json(vendor);
};

export const createPurchase = async (req: Request, res: Response) => {
  const quantity = Number(req.body.quantity);
  const unitCost = new Prisma.Decimal(req.body.unitCost);
  const totalCost = unitCost.mul(quantity);
  const purchasedAt = req.body.purchasedAt ? new Date(req.body.purchasedAt) : new Date();

  const purchase = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: req.body.productId },
      include: { inventory: true }
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const entry = await tx.purchaseEntry.create({
      data: {
        vendorId: req.body.vendorId,
        productId: req.body.productId,
        quantity,
        unitCost,
        totalCost,
        invoiceRef: req.body.invoiceRef || null,
        notes: req.body.notes || null,
        purchasedAt
      },
      include: {
        vendor: true,
        product: {
          include: {
            brand: true,
            model: true,
            category: true,
            inventory: true
          }
        }
      }
    });

    if (product.inventory) {
      await tx.inventory.update({
        where: { productId: req.body.productId },
        data: {
          stock: { increment: quantity },
          lastRestockedAt: purchasedAt
        }
      });
    } else {
      await tx.inventory.create({
        data: {
          productId: req.body.productId,
          stock: quantity,
          lowStockLimit: 5,
          lastRestockedAt: purchasedAt
        }
      });
    }

    await tx.product.update({
      where: { id: req.body.productId },
      data: { stock: { increment: quantity } }
    });

    return entry;
  });

  res.status(201).json({
    ...purchase,
    unitCost: Number(purchase.unitCost),
    totalCost: Number(purchase.totalCost)
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
            category: true,
            orderItems: {
              where: {
                order: {
                  status: { in: ["PENDING", "CONFIRMED", "PACKED", "SHIPPED"] }
                }
              },
              select: {
                orderId: true
              }
            }
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

  const enrichedItems = items.map((item) => ({
    ...item,
    impactedActiveOrders: new Set(item.product.orderItems.map((entry) => entry.orderId)).size
  }));

  res.json({
    items: enrichedItems,
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
