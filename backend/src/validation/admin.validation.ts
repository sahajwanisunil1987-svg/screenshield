import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
};

export const adminDashboardSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d").optional()
});

export const adminInvoiceListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "GENERATED", "PENDING"]).default("ALL").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
});

export const adminUserListSchema = z.object({
  search: z.string().optional(),
  activity: z.enum(["ALL", "WITH_ORDERS", "WITHOUT_ORDERS"]).default("ALL").optional(),
  ...paginationFields
});

export const adminInventoryListSchema = z.object({
  search: z.string().optional(),
  stock: z.enum(["ALL", "CRITICAL", "LOW", "HEALTHY"]).default("ALL").optional(),
  ...paginationFields
});


export const adminSupportTicketListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "NEW", "IN_PROGRESS", "RESOLVED"]).default("ALL").optional(),
  kind: z.enum(["ALL", "ORDER_ISSUE", "RETURN_ISSUE", "PAYMENT_ISSUE", "PRODUCT_INQUIRY", "OTHER"]).default("ALL").optional(),
  ...paginationFields
});


export const adminAccountingSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d").optional()
});


export const adminPurchaseListSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d").optional(),
  vendorId: z.string().optional(),
  ...paginationFields
});

export const adminVendorCreateSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional()
});

export const adminPurchaseCreateSchema = z.object({
  vendorId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().positive(),
  invoiceRef: z.string().optional(),
  notes: z.string().optional(),
  purchasedAt: z.string().datetime().optional()
});
