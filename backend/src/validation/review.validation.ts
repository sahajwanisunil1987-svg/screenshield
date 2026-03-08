import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(8)
});

export const adminReviewListSchema = z.object({
  search: z.string().optional(),
  rating: z.enum(["ALL", "1", "2", "3", "4", "5"]).default("ALL").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
});
