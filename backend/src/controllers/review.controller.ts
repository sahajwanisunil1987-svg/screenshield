import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { calculateAverage, getSingleParam } from "../utils/helpers.js";

export const getReviews = async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { productId: getSingleParam(req.params.id)! },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(reviews);
};

export const createReview = async (req: Request, res: Response) => {
  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: req.user!.userId,
        productId: getSingleParam(req.params.id)!
      }
    },
    update: req.body,
    create: {
      ...req.body,
      userId: req.user!.userId,
      productId: getSingleParam(req.params.id)!
    }
  });

  const productId = getSingleParam(req.params.id)!;
  const reviews = await prisma.review.findMany({ where: { productId } });
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: calculateAverage(reviews.map((item: { rating: number }) => item.rating)),
      reviewCount: reviews.length
    }
  });

  res.status(StatusCodes.CREATED).json(review);
};

export const adminReviews = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  const search = String(req.query.search ?? "").trim();
  const rating = String(req.query.rating ?? "ALL");

  const where = {
    ...(rating !== "ALL" ? { rating: Number(rating) } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { comment: { contains: search, mode: "insensitive" as const } },
            { product: { name: { contains: search, mode: "insensitive" as const } } },
            { product: { sku: { contains: search, mode: "insensitive" as const } } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        },
        product: {
          select: { id: true, name: true, slug: true, sku: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
