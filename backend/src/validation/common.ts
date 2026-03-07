import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1)
});

export const skuParamSchema = z.object({
  sku: z.string().min(1)
});

export const slugParamSchema = z.object({
  slug: z.string().min(1)
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(12).optional(),
  search: z.string().optional()
});
