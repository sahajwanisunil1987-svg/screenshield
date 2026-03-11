import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1)
      })
    )
    .min(1),
  address: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(5),
    line2: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(5),
    country: z.string().default("India"),
    phone: z.string().min(10),
    email: z.string().email(),
    gstNumber: z.string().optional()
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).default("RAZORPAY"),
  notes: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "COD"]).optional(),
  shippingCourier: z.string().max(120).optional(),
  shippingAwb: z.string().max(120).optional(),
  estimatedDeliveryAt: z.string().datetime().optional().or(z.literal("")),
  adminNotes: z.string().max(1000).optional(),
  internalNotes: z.string().max(2000).optional(),
  refundAmount: z.coerce.number().min(0).optional(),
  refundReason: z.string().max(1000).optional()
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(5).max(500)
});

export const returnOrderSchema = z.object({
  reason: z.string().min(5).max(500)
});

export const couponValidationSchema = z.object({
  code: z.string().min(2),
  subtotal: z.coerce.number().positive()
});

export const couponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().positive().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true)
});

export const inventoryUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0),
  lowStockLimit: z.coerce.number().int().min(0).max(999),
  warehouseCode: z.string().max(50).optional(),
  lastRestockedAt: z.string().datetime().optional()
});

export const adminOrderListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]).default("ALL").optional(),
  paymentStatus: z
    .enum(["ALL", "PENDING", "PAID", "FAILED", "REFUNDED", "COD"])
    .default("ALL")
    .optional(),
  opsView: z
    .enum(["ALL", "PENDING_CANCEL", "PENDING_RETURN", "AWAITING_PACKING", "AWAITING_SHIPMENT", "MISSING_SHIPMENT_FIELDS"])
    .default("ALL")
    .optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(8).optional()
});

export const adminCouponListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL").optional(),
  type: z.enum(["ALL", "PERCENTAGE", "FLAT"]).default("ALL").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
});

export const reviewRequestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(1000).optional()
});
