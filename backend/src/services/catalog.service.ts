import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toSlug } from "../utils/helpers.js";

const normalize = (value: string) => value.trim().toLowerCase();

const scoreProductSearchMatch = (
  product: {
    name: string;
    sku: string;
    shortDescription: string;
    brand: { name: string };
    model: { name: string };
    category: { name: string };
    isFeatured?: boolean | null;
  },
  rawQuery: string
) => {
  const query = normalize(rawQuery);
  const sku = normalize(product.sku);
  const name = normalize(product.name);
  const shortDescription = normalize(product.shortDescription);
  const brand = normalize(product.brand.name);
  const model = normalize(product.model.name);
  const category = normalize(product.category.name);
  const composite = `${brand} ${model} ${category} ${name} ${sku} ${shortDescription}`;

  let score = 0;

  if (sku === query) score += 1000;
  else if (sku.startsWith(query)) score += 650;
  else if (sku.includes(query)) score += 420;

  if (name === query) score += 800;
  else if (name.startsWith(query)) score += 520;
  else if (name.includes(query)) score += 300;

  if (brand === query || model === query || category === query) score += 260;
  if (brand.includes(query)) score += 120;
  if (model.includes(query)) score += 120;
  if (category.includes(query)) score += 90;
  if (shortDescription.includes(query)) score += 40;
  if (composite.includes(query)) score += 20;
  if (product.isFeatured) score += 10;

  return score;
};

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
  const include = {
    images: { orderBy: { sortOrder: "asc" as const } },
    brand: true,
    model: true,
    category: true,
    inventory: true
  };

  const total = await prisma.product.count({ where });

  const items = query.search
    ? await prisma.product
        .findMany({
          where,
          include,
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: Math.min(Math.max(page * limit * 4, 40), 120)
        })
        .then((results) =>
          results
            .sort((left, right) => {
              const leftScore = scoreProductSearchMatch(left, query.search!);
              const rightScore = scoreProductSearchMatch(right, query.search!);
              return rightScore - leftScore;
            })
            .slice((page - 1) * limit, page * limit)
        )
    : await prisma.product.findMany({
        where,
        include,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit
      });

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

export const getProductSuggestions = async (query: {
  q?: string;
  brand?: string;
  model?: string;
  category?: string;
  limit?: number;
}) => {
  const q = query.q?.trim();
  if (!q) {
    return [];
  }

  const limit = query.limit ?? 6;
  const items = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(query.brand ? { brand: { slug: query.brand } } : {}),
      ...(query.model ? { model: { slug: query.model } } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } }
      ]
    },
    include: {
      brand: true,
      model: true,
      category: true
    },
    orderBy: [{ isFeatured: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
    take: Math.min(limit * 3, 18)
  });

  return items
    .sort((left, right) => scoreProductSearchMatch(right, q) - scoreProductSearchMatch(left, q))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      type: "product" as const,
      label: item.name,
      hint: `${item.brand.name} · ${item.model.name} · ${item.category.name} · SKU ${item.sku}`,
      slug: item.slug,
      searchTerm: item.name
    }));
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

export const getAdminProducts = async () =>
  prisma.product.findMany({
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      model: true,
      category: true,
      inventory: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });

export const listAdminProducts = async (query: {
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  feature?: "ALL" | "FEATURED" | "STANDARD";
  page?: number;
  limit?: number;
}) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;

  const where: Prisma.ProductWhereInput = {
    ...(query.status === "ACTIVE" ? { isActive: true } : {}),
    ...(query.status === "INACTIVE" ? { isActive: false } : {}),
    ...(query.feature === "FEATURED" ? { isFeatured: true } : {}),
    ...(query.feature === "STANDARD" ? { isFeatured: false } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { brand: { name: { contains: query.search, mode: "insensitive" } } },
            { model: { name: { contains: query.search, mode: "insensitive" } } },
            { category: { name: { contains: query.search, mode: "insensitive" } } }
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
      orderBy: [{ updatedAt: "desc" }],
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

export const getAdminProductById = (id: string) =>
  prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      model: true,
      category: true,
      inventory: true
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
  lowStockLimit?: number;
  warehouseCode?: string;
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
          lowStockLimit: payload.lowStockLimit ?? 5,
          warehouseCode: payload.warehouseCode
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
            stock: payload.stock,
            lowStockLimit: payload.lowStockLimit ?? 5,
            warehouseCode: payload.warehouseCode
          },
          create: {
            stock: payload.stock,
            lowStockLimit: payload.lowStockLimit ?? 5,
            warehouseCode: payload.warehouseCode
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
