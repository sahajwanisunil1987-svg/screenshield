import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true)
});

export const modelSchema = z.object({
  name: z.string().min(2),
  brandId: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true)
});

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  usesVariants: z.boolean().default(false),
  variantLabel: z.string().max(40).optional().or(z.literal("")),
  isActive: z.boolean().default(true)
});

const productVariantSchema = z.object({
  label: z.string().min(1).max(40),
  sku: z.string().min(3),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const productSchema = z.object({
  name: z.string().min(3),
  sku: z.string().min(3),
  hsnCode: z.string().max(20).optional().nullable(),
  gstRate: z.coerce.number().min(0).max(100).default(18),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  specifications: z.record(z.string(), z.string()),
  hasVariants: z.boolean().default(false),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().positive().optional().nullable(),
  warrantyMonths: z.coerce.number().min(0).default(6),
  brandId: z.string().min(1),
  modelId: z.string().min(1),
  compatibleModelIds: z.array(z.string().min(1)).default([]).optional(),
  categoryId: z.string().min(1),
  stock: z.coerce.number().min(0).default(0),
  lowStockLimit: z.coerce.number().min(0).max(999).default(5).optional(),
  warehouseCode: z.string().max(50).optional(),
  videoUrl: z.string().url().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantSchema).default([]).optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).min(1).max(7)
}).superRefine((value, ctx) => {
  if (value.hasVariants && (!value.variants || value.variants.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variants"],
      message: "Add at least one variant when variants are enabled"
    });
  }
});

export const productSearchSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["relevance", "newest", "price-low", "price-high", "rating"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(40).default(12).optional()
});

export const productSuggestionSchema = z.object({
  q: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(10).default(6).optional()
});

export const adminProductListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL").optional(),
  feature: z.enum(["ALL", "FEATURED", "STANDARD"]).default("ALL").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
});
