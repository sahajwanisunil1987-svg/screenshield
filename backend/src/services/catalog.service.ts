import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toSlug } from "../utils/helpers.js";

const normalize = (value: string) => value.trim().toLowerCase();

const tokenize = (value: string) =>
  normalize(value)
    .split(/[\s,/+-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const scoreProductSearchMatch = (
  product: {
    name: string;
    sku: string;
    shortDescription: string;
    brand: { name: string };
    model: { name: string };
    category: { name: string };
    compatibilityModels?: Array<{ model: { name: string } }>;
    isFeatured?: boolean | null;
  },
  rawQuery: string
) => {
  const query = normalize(rawQuery);
  const tokens = tokenize(rawQuery);
  const sku = normalize(product.sku);
  const name = normalize(product.name);
  const shortDescription = normalize(product.shortDescription);
  const brand = normalize(product.brand.name);
  const model = normalize(product.model.name);
  const category = normalize(product.category.name);
  const compatibilityNames = product.compatibilityModels?.map((entry) => normalize(entry.model.name)) ?? [model];
  const composite = `${brand} ${model} ${compatibilityNames.join(" ")} ${category} ${name} ${sku} ${shortDescription}`;

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
  if (compatibilityNames.some((entry) => entry === query)) score += 220;
  if (compatibilityNames.some((entry) => entry.includes(query))) score += 110;
  if (category.includes(query)) score += 90;
  if (shortDescription.includes(query)) score += 40;
  if (composite.includes(query)) score += 20;
  if (product.isFeatured) score += 10;

  if (tokens.length > 1) {
    const tokenMatches = tokens.reduce((count, token) => {
      if (
        sku.includes(token) ||
        name.includes(token) ||
        brand.includes(token) ||
        model.includes(token) ||
        category.includes(token) ||
        compatibilityNames.some((entry) => entry.includes(token))
      ) {
        return count + 1;
      }

      return count;
    }, 0);

    score += tokenMatches * 90;

    const hasBrandToken = tokens.some((token) => brand.includes(token));
    const hasModelToken = tokens.some((token) => model.includes(token) || compatibilityNames.some((entry) => entry.includes(token)));
    const hasCategoryToken = tokens.some((token) => category.includes(token) || name.includes(token));

    if (hasBrandToken && hasModelToken) score += 280;
    if (hasBrandToken && hasCategoryToken) score += 220;
    if (hasModelToken && hasCategoryToken) score += 220;
    if (hasBrandToken && hasModelToken && hasCategoryToken) score += 420;
  }

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
  sort?: "relevance" | "newest" | "price-low" | "price-high" | "rating";
  featured?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const sort = query.sort ?? (query.search ? "relevance" : "newest");

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
    compatibilityModels: {
      include: {
        model: true
      }
    },
    inventory: true
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-low"
      ? [{ price: "asc" }, { isFeatured: "desc" }, { createdAt: "desc" }]
      : sort === "price-high"
        ? [{ price: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }]
        : sort === "rating"
          ? [{ averageRating: "desc" }, { reviewCount: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }]
          : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const total = await prisma.product.count({ where });

  const items = query.search && sort === "relevance"
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
        orderBy,
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
      category: true,
      compatibilityModels: {
        include: {
          model: true
        }
      }
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
      compatibilityModels: {
        include: {
          model: {
            include: {
              brand: true
            }
          }
        },
        orderBy: {
          model: {
            name: "asc"
          }
        }
      },
      inventory: true,
      reviews: {
        where: {
          status: "APPROVED"
        },
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
        compatibilityModels: {
          include: {
            model: true
          }
        },
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
      compatibilityModels: {
        include: {
          model: true
        },
        orderBy: {
          model: {
            name: "asc"
          }
        }
      },
      inventory: true
    }
  });

export const createBrand = (payload: { name: string; description?: string; logoUrl?: string; isActive: boolean }) =>
  prisma.brand.create({
    data: {
      ...payload,
      logoUrl: payload.logoUrl || null,
      slug: toSlug(payload.name)
    }
  });

export const updateBrand = (id: string, payload: { name: string; description?: string; logoUrl?: string; isActive: boolean }) =>
  prisma.brand.update({
    where: { id },
    data: {
      ...payload,
      logoUrl: payload.logoUrl || null,
      slug: toSlug(payload.name)
    }
  });

export const deleteBrand = (id: string) => prisma.brand.delete({ where: { id } });

export const createModel = (payload: { name: string; imageUrl?: string; brandId: string; isActive: boolean }) =>
  prisma.mobileModel.create({
    data: {
      ...payload,
      imageUrl: payload.imageUrl || null,
      slug: toSlug(payload.name)
    }
  });

export const updateModel = (id: string, payload: { name: string; imageUrl?: string; brandId: string; isActive: boolean }) =>
  prisma.mobileModel.update({
    where: { id },
    data: {
      ...payload,
      imageUrl: payload.imageUrl || null,
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
  compatibleModelIds?: string[];
  categoryId: string;
  stock: number;
  lowStockLimit?: number;
  warehouseCode?: string;
  videoUrl?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  images: { url: string; alt?: string }[];
}) => {
  const { compatibleModelIds = [], lowStockLimit, warehouseCode, stock, images, specifications, videoUrl, ...productData } = payload;
  const normalizedCompatibleModelIds = Array.from(new Set([payload.modelId, ...compatibleModelIds]));

  return prisma.product.create({
    data: {
      ...productData,
      slug: toSlug(`${payload.name}-${payload.sku}`),
      specifications,
      videoUrl: videoUrl || null,
      compatibilityModels: {
        create: normalizedCompatibleModelIds.map((modelId) => ({
          modelId
        }))
      },
      images: {
        create: images.map((image, index) => ({
          ...image,
          sortOrder: index
        }))
      },
      inventory: {
        create: {
          stock,
          lowStockLimit: lowStockLimit ?? 5,
          warehouseCode
        }
      }
    },
    include: {
      images: true,
      inventory: true,
      compatibilityModels: {
        include: {
          model: true
        }
      }
    }
  });
};

export const updateProduct = async (id: string, payload: Parameters<typeof createProduct>[0]) => {
  await prisma.productImage.deleteMany({ where: { productId: id } });
  await prisma.productCompatibility.deleteMany({ where: { productId: id } });

  const { compatibleModelIds = [], lowStockLimit, warehouseCode, stock, images, specifications, videoUrl, ...productData } = payload;
  const normalizedCompatibleModelIds = Array.from(new Set([payload.modelId, ...compatibleModelIds]));

  return prisma.product.update({
    where: { id },
    data: {
      ...productData,
      slug: toSlug(`${payload.name}-${payload.sku}`),
      specifications,
      videoUrl: videoUrl || null,
      compatibilityModels: {
        create: normalizedCompatibleModelIds.map((modelId) => ({
          modelId
        }))
      },
      images: {
        create: images.map((image, index) => ({
          ...image,
          sortOrder: index
        }))
      },
      inventory: {
        upsert: {
          update: {
            stock,
            lowStockLimit: lowStockLimit ?? 5,
            warehouseCode
          },
          create: {
            stock,
            lowStockLimit: lowStockLimit ?? 5,
            warehouseCode
          }
        }
      }
    },
    include: {
      images: true,
      inventory: true,
      compatibilityModels: {
        include: {
          model: true
        }
      }
    }
  });
};

export const deleteProduct = (id: string) => prisma.product.delete({ where: { id } });
