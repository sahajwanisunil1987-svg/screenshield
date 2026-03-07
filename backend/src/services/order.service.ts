import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { createInvoiceNumber, createOrderNumber } from "../utils/helpers.js";

const decimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

export const validateCoupon = async (code: string, subtotal: number) => {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
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

export const createOrder = async (
  userId: string,
  payload: {
    items: { productId: string; quantity: number }[];
    address: Record<string, string | undefined>;
    couponCode?: string;
    paymentMethod: "RAZORPAY" | "COD";
    notes?: string;
  }
) => {
  const productIds = payload.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { inventory: true }
  });

  if (products.length !== payload.items.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more products are unavailable");
  }

  let subtotal = 0;
  const orderItems = payload.items.map((item) => {
      const product = products.find((entry: (typeof products)[number]) => entry.id === item.productId);
    if (!product) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid product in cart");
    }

    if ((product.inventory?.stock ?? product.stock) < item.quantity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient stock for ${product.name}`);
    }

    const lineTotal = Number(product.price) * item.quantity;
    subtotal += lineTotal;

    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice: decimal(Number(product.price)),
      totalPrice: decimal(lineTotal),
      productName: product.name,
      productSku: product.sku
    };
  });

  let discountAmount = 0;
  let couponId: string | undefined;
  if (payload.couponCode) {
    const { coupon, discount } = await validateCoupon(payload.couponCode, subtotal);
    discountAmount = discount;
    couponId = coupon.id;
  }

  const shippingAmount = subtotal > 999 ? 0 : 79;
  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber: createOrderNumber(),
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
        create: orderItems
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
      invoice: true
    }
  });

  await Promise.all(
    products.map((product: (typeof products)[number]) => {
      const qty = payload.items.find((item) => item.productId === product.id)?.quantity ?? 0;
      return prisma.inventory.upsert({
        where: { productId: product.id },
        update: {
          stock: { decrement: qty }
        },
        create: {
          productId: product.id,
          stock: Math.max(product.stock - qty, 0),
          lowStockLimit: 5
        }
      });
    })
  );

  if (couponId) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } }
    });
  }

  const existingDefaultAddress = await prisma.address.findFirst({
    where: { userId, isDefault: true },
    select: { id: true }
  });

  await prisma.address.upsert({
    where: existingDefaultAddress ? { id: existingDefaultAddress.id } : { id: "__new_default_address__" },
    update: {
      fullName: payload.address.fullName as string,
      line1: payload.address.line1 as string,
      line2: payload.address.line2 as string | undefined,
      landmark: payload.address.landmark as string | undefined,
      city: payload.address.city as string,
      state: payload.address.state as string,
      postalCode: (payload.address.postalCode ?? payload.address.pincode) as string,
      country: (payload.address.country as string | undefined) ?? "India",
      phone: payload.address.phone as string,
      gstNumber: payload.address.gstNumber as string | undefined,
      isDefault: true
    },
    create: {
      userId,
      fullName: payload.address.fullName as string,
      line1: payload.address.line1 as string,
      line2: payload.address.line2 as string | undefined,
      landmark: payload.address.landmark as string | undefined,
      city: payload.address.city as string,
      state: payload.address.state as string,
      postalCode: (payload.address.postalCode ?? payload.address.pincode) as string,
      country: (payload.address.country as string | undefined) ?? "India",
      phone: payload.address.phone as string,
      gstNumber: payload.address.gstNumber as string | undefined,
      isDefault: true
    }
  }).catch(async () => {
    await prisma.address.create({
      data: {
        userId,
        fullName: payload.address.fullName as string,
        line1: payload.address.line1 as string,
        line2: payload.address.line2 as string | undefined,
        landmark: payload.address.landmark as string | undefined,
        city: payload.address.city as string,
        state: payload.address.state as string,
        postalCode: (payload.address.postalCode ?? payload.address.pincode) as string,
        country: (payload.address.country as string | undefined) ?? "India",
        phone: payload.address.phone as string,
        gstNumber: payload.address.gstNumber as string | undefined,
        isDefault: true
      }
    });
  });

  return order;
};

export const getUserOrders = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      payment: true
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

export const trackOrder = async (orderNumber: string) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return order;
};

export const adminOrders = () =>
  prisma.order.findMany({
    include: {
      user: {
        select: { name: true, email: true, phone: true }
      },
      items: true,
      payment: true,
      invoice: true
    },
    orderBy: { createdAt: "desc" }
  });

export const updateOrderStatus = (id: string, payload: { status: OrderStatus; paymentStatus?: PaymentStatus }) =>
  prisma.order.update({
    where: { id },
    data: {
      status: payload.status,
      ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {})
    },
    include: {
      items: true,
      payment: true,
      invoice: true,
      user: {
        select: { name: true, email: true, phone: true }
      }
    }
  });
