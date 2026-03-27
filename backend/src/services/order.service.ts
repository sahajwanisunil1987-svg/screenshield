import { OrderStatus, PaymentStatus, Prisma, RequestStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { createInvoiceNumber, createOrderNumber } from "../utils/helpers.js";
import { ensureAppSettings } from "./app-settings.service.js";

const decimal = (value: number) => new Prisma.Decimal(value.toFixed(2));


const parseDisabledCodPincodes = (value: string | undefined) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );

const assertCodAllowed = (
  postalCode: string | undefined,
  totalAmount: number,
  codMaxOrderValue: number,
  codDisabledPincodes: Set<string>
) => {
  if (totalAmount > codMaxOrderValue) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cash on Delivery is available only for orders up to Rs. ${codMaxOrderValue}.`
    );
  }

  if (postalCode && codDisabledPincodes.has(postalCode.trim())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cash on Delivery is not available for this pincode.");
  }
};

type OrderTx = Prisma.TransactionClient;

type CouponValidationResult = {
  coupon: {
    id: string;
    type: "PERCENTAGE" | "FLAT";
    value: Prisma.Decimal;
    maxDiscount: Prisma.Decimal | null;
    usageLimit: number | null;
    usedCount: number;
  };
  discount: number;
};

const validateCouponWithClient = async (client: Pick<OrderTx, "coupon">, code: string, subtotal: number): Promise<CouponValidationResult> => {
  const coupon = await client.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid coupon code");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon has expired");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon usage limit reached");
  }

  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Order value is below coupon minimum");
  }

  let discount =
    coupon.type === "PERCENTAGE"
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

  if (coupon.maxDiscount) {
    discount = Math.min(discount, Number(coupon.maxDiscount));
  }

  return { coupon, discount };
};

export const validateCoupon = async (code: string, subtotal: number) => validateCouponWithClient(prisma, code, subtotal);

const upsertDefaultAddress = async (client: OrderTx, userId: string, address: Record<string, string | undefined>) => {
  const existingDefaultAddress = await client.address.findFirst({
    where: { userId, isDefault: true },
    select: { id: true }
  });

  const addressData = {
    fullName: address.fullName as string,
    line1: address.line1 as string,
    line2: address.line2 as string | undefined,
    landmark: address.landmark as string | undefined,
    city: address.city as string,
    state: address.state as string,
    postalCode: (address.postalCode ?? address.pincode) as string,
    country: (address.country as string | undefined) ?? "India",
    phone: address.phone as string,
    gstNumber: address.gstNumber as string | undefined,
    isDefault: true
  };

  if (existingDefaultAddress) {
    return client.address.update({
      where: { id: existingDefaultAddress.id },
      data: addressData
    });
  }

  return client.address.create({
    data: {
      userId,
      ...addressData
    }
  });
};

export const createOrder = async (
  userId: string,
  payload: {
    items: { productId: string; variantId?: string; quantity: number }[];
    address: Record<string, string | undefined>;
    couponCode?: string;
    paymentMethod: "RAZORPAY" | "COD";
    notes?: string;
  }
) => {
  if (!payload.items.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cart is empty");
  }

  return prisma.$transaction(async (tx) => {
    const appSettings = await ensureAppSettings(tx);
    const shippingFee = Number(appSettings.shippingFee ?? 79);
    const freeShippingThreshold = Number(appSettings.freeShippingThreshold ?? 999);
    const codMaxOrderValue = Number(appSettings.codMaxOrderValue ?? env.COD_MAX_ORDER_VALUE);
    const disabledCodPincodes = parseDisabledCodPincodes(appSettings.codDisabledPincodes || env.COD_DISABLED_PINCODES);

    const productIds = payload.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        inventory: true,
        variants: {
          where: { isActive: true }
        }
      }
    });

    if (products.length !== payload.items.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "One or more products are unavailable");
    }

    let subtotal = 0;
    const rawOrderItems = payload.items.map((item) => {
      const product = products.find((entry: (typeof products)[number]) => entry.id === item.productId);
      if (!product) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid product in cart");
      }

      const selectedVariant = item.variantId
        ? product.variants.find((variant) => variant.id === item.variantId)
        : null;

      if (item.variantId && !selectedVariant) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Selected variant is unavailable for ${product.name}`);
      }

      const availableStock = selectedVariant ? selectedVariant.stock : (product.inventory?.stock ?? product.stock);
      if (availableStock < item.quantity) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Insufficient stock for ${selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name}`
        );
      }

      const unitPriceValue = Number(selectedVariant?.price ?? product.price);
      const lineTotal = unitPriceValue * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.label ?? null,
        quantity: item.quantity,
        unitPriceValue,
        lineTotal,
        gstRate: Number(product.gstRate ?? 18),
        productName: product.name,
        productSku: selectedVariant?.sku ?? product.sku
      };
    });

    let discountAmount = 0;
    let couponId: string | undefined;
    let couponUsageLimit: number | null = null;
    if (payload.couponCode) {
      const { coupon, discount } = await validateCouponWithClient(tx, payload.couponCode, subtotal);
      discountAmount = discount;
      couponId = coupon.id;
      couponUsageLimit = coupon.usageLimit;
    }

    const orderItems = rawOrderItems.map((item) => {
      const allocatedDiscount = subtotal > 0 ? (item.lineTotal / subtotal) * discountAmount : 0;
      const taxableLineTotal = Math.max(item.lineTotal - allocatedDiscount, 0);
      const lineTax = taxableLineTotal * (item.gstRate / 100);

      return {
        productId: item.productId,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        unitPrice: decimal(item.unitPriceValue),
        totalPrice: decimal(item.lineTotal),
        lineTax,
        productName: item.productName,
        productSku: item.productSku
      };
    });

    const shippingAmount = subtotal > freeShippingThreshold ? 0 : shippingFee;
    const taxAmount = orderItems.reduce((sum, item) => sum + item.lineTax, 0);
    const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

    if (payload.paymentMethod === "COD") {
      assertCodAllowed(
        (payload.address.postalCode ?? payload.address.pincode) as string | undefined,
        totalAmount,
        codMaxOrderValue,
        disabledCodPincodes
      );
    }

    if (payload.paymentMethod === "COD") {
      for (const product of products) {
        const productItems = payload.items.filter((item) => item.productId === product.id);
        if (!productItems.length) continue;

        for (const item of productItems) {
          const qty = item.quantity;
          const selectedVariant = item.variantId
            ? product.variants.find((variant) => variant.id === item.variantId)
            : null;

          if (selectedVariant) {
            const variantUpdate = await tx.productVariant.updateMany({
              where: {
                id: selectedVariant.id,
                stock: { gte: qty }
              },
              data: {
                stock: { decrement: qty }
              }
            });

            if (variantUpdate.count === 0) {
              throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient stock for ${product.name} (${selectedVariant.label})`);
            }
          }

          if (product.inventory) {
            const inventoryUpdate = await tx.inventory.updateMany({
              where: {
                productId: product.id,
                stock: { gte: qty }
              },
              data: {
                stock: { decrement: qty }
              }
            });

            if (inventoryUpdate.count === 0) {
              throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient stock for ${product.name}`);
            }
          } else {
            const productUpdate = await tx.product.updateMany({
              where: {
                id: product.id,
                stock: { gte: qty }
              },
              data: {
                stock: { decrement: qty }
              }
            });

            if (productUpdate.count === 0) {
              throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient stock for ${product.name}`);
            }
          }
        }
      }

      if (couponId) {
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: couponId,
            ...(couponUsageLimit ? { usedCount: { lt: couponUsageLimit } } : {})
          },
          data: { usedCount: { increment: 1 } }
        });

        if (couponUpdate.count === 0) {
          throw new ApiError(StatusCodes.CONFLICT, "Coupon usage limit reached");
        }
      }
    }

    const order = await tx.order.create({
      data: {
        userId,
        orderNumber: createOrderNumber(appSettings.orderPrefix ?? "PJX"),
        couponId,
        addressSnapshot: payload.address,
        subtotal: decimal(subtotal),
        discountAmount: decimal(discountAmount),
        shippingAmount: decimal(shippingAmount),
        taxAmount: decimal(taxAmount),
        totalAmount: decimal(totalAmount),
        notes: payload.notes,
        gstNumber: payload.address.gstNumber,
        paymentStatus: payload.paymentMethod === "COD" ? PaymentStatus.COD : PaymentStatus.PENDING,
        items: {
          create: orderItems.map(({ lineTax: _lineTax, ...item }) => item)
        },
        payment: {
          create: {
            amount: decimal(totalAmount),
            status: payload.paymentMethod === "COD" ? PaymentStatus.COD : PaymentStatus.PENDING,
            provider: payload.paymentMethod === "COD" ? "COD" : "RAZORPAY"
          }
        },
        invoice: {
          create: {
            invoiceNumber: createInvoiceNumber(),
            gstin: payload.address.gstNumber,
            billingName: payload.address.fullName as string,
            billingEmail: payload.address.email as string | undefined,
            billingPhone: payload.address.phone as string
          }
        }
      },
      include: {
        items: true,
        payment: true,
        invoice: true,
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    await upsertDefaultAddress(tx, userId, payload.address);

    return order;
  });
};

export const getUserOrders = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      payment: true,
      invoice: true
    },
    orderBy: { createdAt: "desc" }
  });

export const getOrderById = async (orderId: string, userId?: string, isAdmin?: boolean) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      },
      payment: true,
      invoice: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (!isAdmin && order.userId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");
  }

  return order;
};

export const requestOrderCancellation = async (orderId: string, userId: string, reason: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.userId != userId) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This order can no longer be cancelled from the customer side");
  }

  if (order.cancelRequestedAt) {
    throw new ApiError(StatusCodes.CONFLICT, "Cancellation has already been requested for this order");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      cancelRequestedAt: new Date(),
      cancelRequestReason: reason,
      cancelRequestStatus: RequestStatus.PENDING,
      cancelDecisionAt: null,
      cancelDecisionNote: null
    },
    include: {
      items: true,
      payment: true,
      invoice: true
    }
  });
};

export const requestReturn = async (orderId: string, userId: string, reason: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.userId != userId) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (order.status !== OrderStatus.DELIVERED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Return requests are allowed only after delivery.");
  }

  if (order.returnRequestedAt) {
    throw new ApiError(StatusCodes.CONFLICT, "Return has already been requested for this order");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      returnRequestedAt: new Date(),
      returnRequestReason: reason,
      returnRequestStatus: RequestStatus.PENDING,
      returnDecisionAt: null,
      returnDecisionNote: null
    },
    include: {
      items: true,
      payment: true,
      invoice: true
    }
  });
};

export const reviewCancelRequest = async (orderId: string, action: "APPROVE" | "REJECT", note?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
      invoice: true,
      user: { select: { id: true, name: true, email: true, phone: true } }
    }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (order.cancelRequestStatus !== RequestStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "There is no pending cancellation request for this order");
  }

  if (action === "APPROVE") {
    return updateOrderStatus(orderId, {
      status: OrderStatus.CANCELLED,
      paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus,
      shippingCourier: order.shippingCourier ?? undefined,
      shippingAwb: order.shippingAwb ?? undefined,
      estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString(),
      adminNotes: note ?? order.adminNotes ?? undefined,
      refundAmount: order.paymentStatus === PaymentStatus.PAID ? Number(order.totalAmount) : 0,
      refundReason: note ?? order.cancelRequestReason ?? order.adminNotes ?? undefined
    }).then((updated) =>
      prisma.order.update({
        where: { id: orderId },
        data: {
          cancelRequestStatus: RequestStatus.APPROVED,
          cancelDecisionAt: new Date(),
          cancelDecisionNote: note ?? null
        },
        include: {
          items: true,
          payment: true,
          invoice: true,
          user: { select: { id: true, name: true, email: true, phone: true } }
        }
      })
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      cancelRequestStatus: RequestStatus.REJECTED,
      cancelDecisionAt: new Date(),
      cancelDecisionNote: note ?? null
    },
    include: {
      items: true,
      payment: true,
      invoice: true,
      user: { select: { id: true, name: true, email: true, phone: true } }
    }
  });
};

export const reviewReturnRequest = async (orderId: string, action: "APPROVE" | "REJECT", note?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
      invoice: true,
      user: { select: { id: true, name: true, email: true, phone: true } }
    }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (order.returnRequestStatus !== RequestStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "There is no pending return request for this order");
  }

  if (action === "REJECT") {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        returnRequestStatus: RequestStatus.REJECTED,
        returnDecisionAt: new Date(),
        returnDecisionNote: note ?? null
      },
      include: {
        items: true,
        payment: true,
        invoice: true,
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const inventoryUpdate = await tx.inventory.updateMany({
        where: { productId: item.productId },
        data: { stock: { increment: item.quantity } }
      });

      if (inventoryUpdate.count === 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.REFUNDED }
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus,
        returnRequestStatus: RequestStatus.APPROVED,
        returnDecisionAt: new Date(),
        returnDecisionNote: note ?? null,
        returnedAt: new Date(),
        refundAmount: order.paymentStatus === PaymentStatus.PAID ? decimal(Number(order.totalAmount)) : order.refundAmount,
        refundReason: order.paymentStatus === PaymentStatus.PAID ? (note ?? order.returnRequestReason ?? order.adminNotes ?? "Approved return") : order.refundReason,
        refundedAt: order.paymentStatus === PaymentStatus.PAID ? (order.refundedAt ?? new Date()) : order.refundedAt
      },
      include: {
        items: true,
        payment: true,
        invoice: true,
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });
  });
};

export const trackOrder = async (orderNumber: string) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      updatedAt: true,
      confirmedAt: true,
      packedAt: true,
      shippedAt: true,
      deliveredAt: true,
      shippingCourier: true,
      shippingAwb: true,
      estimatedDeliveryAt: true,
      cancelRequestedAt: true,
      cancelRequestStatus: true,
      cancelDecisionAt: true,
      returnRequestedAt: true,
      returnRequestStatus: true,
      returnDecisionAt: true
    }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return order;
};

export const adminOrders = async (query?: {
  search?: string;
  status?: "ALL" | OrderStatus | "RETURNED";
  paymentStatus?: "ALL" | PaymentStatus;
  opsView?: "ALL" | "PENDING_CANCEL" | "PENDING_RETURN" | "AWAITING_PACKING" | "AWAITING_SHIPMENT" | "MISSING_SHIPMENT_FIELDS";
  page?: number;
  limit?: number;
}) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 8;

  const opsViewWhere: Prisma.OrderWhereInput =
    query?.opsView === "PENDING_CANCEL"
      ? { cancelRequestStatus: RequestStatus.PENDING }
      : query?.opsView === "PENDING_RETURN"
        ? { returnRequestStatus: RequestStatus.PENDING }
        : query?.opsView === "AWAITING_PACKING"
          ? { status: OrderStatus.CONFIRMED }
          : query?.opsView === "AWAITING_SHIPMENT"
            ? { status: OrderStatus.PACKED }
            : query?.opsView === "MISSING_SHIPMENT_FIELDS"
              ? {
                  OR: [
                    { status: OrderStatus.SHIPPED, shippingCourier: null },
                    { status: OrderStatus.SHIPPED, shippingAwb: null },
                    { status: OrderStatus.PACKED, estimatedDeliveryAt: null }
                  ]
                }
              : {};

  const where: Prisma.OrderWhereInput = {
    ...(query?.status && query.status !== "ALL"
      ? query.status === "RETURNED"
        ? { returnRequestStatus: RequestStatus.APPROVED }
        : { status: query.status }
      : {}),
    ...(query?.paymentStatus && query.paymentStatus !== "ALL" ? { paymentStatus: query.paymentStatus } : {}),
    ...opsViewWhere,
    ...(query?.search
      ? {
          OR: [
            { orderNumber: { contains: query.search, mode: "insensitive" } },
            { user: { name: { contains: query.search, mode: "insensitive" } } },
            { user: { email: { contains: query.search, mode: "insensitive" } } },
            { user: { phone: { contains: query.search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        items: true,
        payment: true,
        invoice: true
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.order.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const updateOrderStatus = async (id: string, payload: {
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingCourier?: string;
  shippingAwb?: string;
  estimatedDeliveryAt?: string;
  adminNotes?: string;
  internalNotes?: string;
  refundAmount?: number;
  refundReason?: string;
}) =>
  prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingOrder) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
    }

    if (existingOrder.status === OrderStatus.CANCELLED && payload.status !== OrderStatus.CANCELLED) {
      throw new ApiError(StatusCodes.CONFLICT, "Cancelled orders cannot be moved back to an active state");
    }


    const shouldRestoreStock = existingOrder.status !== OrderStatus.CANCELLED && payload.status === OrderStatus.CANCELLED;

    if (shouldRestoreStock) {
      for (const item of existingOrder.items) {
        const inventoryUpdate = await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        if (inventoryUpdate.count === 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }
    }

    const nextPaymentStatus = payload.paymentStatus ?? existingOrder.paymentStatus;
    const willBeRefunded = nextPaymentStatus === PaymentStatus.REFUNDED;
    const now = new Date();
    const timelinePatch: Prisma.OrderUpdateInput = {
      ...(payload.status === OrderStatus.CONFIRMED ? { confirmedAt: existingOrder.confirmedAt ?? now } : {}),
      ...(payload.status === OrderStatus.PACKED ? { confirmedAt: existingOrder.confirmedAt ?? now, packedAt: existingOrder.packedAt ?? now } : {}),
      ...(payload.status === OrderStatus.SHIPPED ? {
        confirmedAt: existingOrder.confirmedAt ?? now,
        packedAt: existingOrder.packedAt ?? existingOrder.confirmedAt ?? now,
        shippedAt: existingOrder.shippedAt ?? now
      } : {}),
      ...(payload.status === OrderStatus.DELIVERED ? {
        confirmedAt: existingOrder.confirmedAt ?? now,
        packedAt: existingOrder.packedAt ?? existingOrder.confirmedAt ?? now,
        shippedAt: existingOrder.shippedAt ?? existingOrder.packedAt ?? existingOrder.confirmedAt ?? now,
        deliveredAt: existingOrder.deliveredAt ?? now
      } : {})
    };
    const fallbackRefundReason = payload.status === OrderStatus.CANCELLED
      ? (payload.refundReason || payload.adminNotes || existingOrder.cancelRequestReason || existingOrder.cancelDecisionNote || existingOrder.adminNotes || "Order cancelled")
      : (payload.refundReason || payload.adminNotes || existingOrder.returnRequestReason || existingOrder.returnDecisionNote || existingOrder.adminNotes || "Order refunded");
    const refundAmount = willBeRefunded
      ? decimal(payload.refundAmount ?? Number(existingOrder.totalAmount))
      : existingOrder.refundAmount;

    if (willBeRefunded) {
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { status: PaymentStatus.REFUNDED }
      });
    }

    return tx.order.update({
      where: { id },
      data: {
        status: payload.status,
        ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {}),
        shippingCourier: payload.shippingCourier || null,
        shippingAwb: payload.shippingAwb || null,
        estimatedDeliveryAt: payload.estimatedDeliveryAt ? new Date(payload.estimatedDeliveryAt) : null,
        adminNotes: payload.adminNotes || null,
        internalNotes: payload.internalNotes || null,
        ...timelinePatch,
        ...(payload.status === OrderStatus.CANCELLED ? { cancelledAt: existingOrder.cancelledAt ?? new Date() } : {}),
        refundAmount,
        refundReason: willBeRefunded ? fallbackRefundReason : existingOrder.refundReason,
        refundedAt: willBeRefunded ? existingOrder.refundedAt ?? new Date() : existingOrder.refundedAt
      },
      include: {
        items: true,
        payment: true,
        invoice: true,
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });
  });
