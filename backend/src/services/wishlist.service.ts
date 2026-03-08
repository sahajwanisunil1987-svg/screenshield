import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";

const wishlistInclude = {
  product: {
    include: {
      images: { orderBy: { sortOrder: "asc" as const } },
      brand: true,
      model: true,
      category: true,
      inventory: true
    }
  }
};

export const getWishlist = async (userId: string) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: wishlistInclude,
    orderBy: { createdAt: "desc" }
  });

  return items.map((item) => item.product);
};

export const addWishlistItem = async (userId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    },
    select: { id: true }
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId
      }
    },
    update: {},
    create: {
      userId,
      productId
    }
  });

  return getWishlist(userId);
};

export const removeWishlistItem = async (userId: string, productId: string) => {
  await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productId
    }
  });

  return getWishlist(userId);
};
