import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
};

export const createSupportTicketSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional().or(z.literal("")),
  subject: z.string().min(5).max(160),
  message: z.string().min(20).max(2000),
  orderNumber: z.string().max(40).optional().or(z.literal("")),
  kind: z.enum(["ORDER_ISSUE", "RETURN_ISSUE", "PAYMENT_ISSUE", "PRODUCT_INQUIRY", "OTHER"]).default("OTHER")
});

export const adminSupportTicketListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "NEW", "IN_PROGRESS", "RESOLVED"]).default("ALL").optional(),
  kind: z.enum(["ALL", "ORDER_ISSUE", "RETURN_ISSUE", "PAYMENT_ISSUE", "PRODUCT_INQUIRY", "OTHER"]).default("ALL").optional(),
  ...paginationFields
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
  adminNotes: z.string().max(2000).optional().or(z.literal(""))
});
