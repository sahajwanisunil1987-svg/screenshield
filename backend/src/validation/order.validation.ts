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
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "COD"]).optional()
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
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(8).optional()
});
