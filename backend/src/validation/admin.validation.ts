import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
};

export const adminUserListSchema = z.object({
  search: z.string().optional(),
  activity: z.enum(["ALL", "WITH_ORDERS", "WITHOUT_ORDERS"]).default("ALL").optional(),
  ...paginationFields
});

export const adminInventoryListSchema = z.object({
  search: z.string().optional(),
  stock: z.enum(["ALL", "LOW", "HEALTHY"]).default("ALL").optional(),
  ...paginationFields
});
