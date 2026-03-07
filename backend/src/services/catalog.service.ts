import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toSlug } from "../utils/helpers.js";

export const getBrands = () =>
  prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

export const getModels = (brandId?: string) =>
  prisma.mobileModel.findMany({
    where: {
      isActive: true,
      ...(brandId ? { brandId } : {})
    },
    include: { brand: true },
    orderBy: { name: "asc" }
  });

export const getCategories = () =>
  prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

export const listProducts = async (query: {
  brand?: string;
  model?: string;
  category?: string;
  search?: string;
  featured?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query.brand ? { brand: { slug: query.brand } } : {}),
    ...(query.model ? { model: { slug: query.model } } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.featured === "true" ? { isFeatured: true } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { shortDescription: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        brand: true,
        model: true,
        category: true,
        inventory: true
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.product.count({ where })
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

export const getProductBySlug = (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      model: true,
      category: true,
      inventory: true,
      reviews: {
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

export const createBrand = (payload: { name: string; description?: string; isActive: boolean }) =>
  prisma.brand.create({
    data: {
      ...payload,
      slug: toSlug(payload.name)
    }
  });

export const updateBrand = (id: string, payload: { name: string; description?: string; isActive: boolean }) =>
  prisma.brand.update({
    where: { id },
    data: {
      ...payload,
      slug: toSlug(payload.name)
    }
  });

export const deleteBrand = (id: string) => prisma.brand.delete({ where: { id } });

export const createModel = (payload: { name: string; brandId: string; isActive: boolean }) =>
  prisma.mobileModel.create({
    data: {
      ...payload,
      slug: toSlug(payload.name)
    }
  });

export const updateModel = (id: string, payload: { name: string; brandId: string; isActive: boolean }) =>
  prisma.mobileModel.update({
    where: { id },
    data: {
      ...payload,
      slug: toSlug(payload.name)
    }
  });

export const deleteModel = (id: string) => prisma.mobileModel.delete({ where: { id } });

export const createCategory = (payload: { name: string; description?: string; isActive: boolean }) =>
  prisma.category.create({
    data: {
      ...payload,
      slug: toSlug(payload.name)
    }
  });

export const updateCategory = (id: string, payload: { name: string; description?: string; isActive: boolean }) =>
  prisma.category.update({
    where: { id },
    data: {
      ...payload,
      slug: toSlug(payload.name)
    }
  });

export const deleteCategory = (id: string) => prisma.category.delete({ where: { id } });

export const createProduct = async (payload: {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  price: number;
  comparePrice?: number | null;
  warrantyMonths: number;
  brandId: string;
  modelId: string;
  categoryId: string;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  images: { url: string; alt?: string }[];
}) =>
  prisma.product.create({
    data: {
      ...payload,
      slug: toSlug(`${payload.name}-${payload.sku}`),
      specifications: payload.specifications,
      images: {
        create: payload.images.map((image, index) => ({
          ...image,
          sortOrder: index
        }))
      },
      inventory: {
        create: {
          stock: payload.stock,
          lowStockLimit: 5
        }
      }
    },
    include: {
      images: true,
      inventory: true
    }
  });

export const updateProduct = async (id: string, payload: Parameters<typeof createProduct>[0]) => {
  await prisma.productImage.deleteMany({ where: { productId: id } });

  return prisma.product.update({
    where: { id },
    data: {
      ...payload,
      slug: toSlug(`${payload.name}-${payload.sku}`),
      specifications: payload.specifications,
      images: {
        create: payload.images.map((image, index) => ({
          ...image,
          sortOrder: index
        }))
      },
      inventory: {
        upsert: {
          update: {
            stock: payload.stock
          },
          create: {
            stock: payload.stock,
            lowStockLimit: 5
          }
        }
      }
    },
    include: {
      images: true,
      inventory: true
    }
  });
};

export const deleteProduct = (id: string) => prisma.product.delete({ where: { id } });
