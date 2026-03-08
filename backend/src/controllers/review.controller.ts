import { ReviewStatus } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { calculateAverage, getSingleParam } from "../utils/helpers.js";

const syncProductReviewMetrics = async (productId: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      status: "APPROVED"
    },
    select: {
      rating: true
    }
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: calculateAverage(reviews.map((item) => item.rating)),
      reviewCount: reviews.length
    }
  });
};

export const getReviews = async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: {
      productId: getSingleParam(req.params.id)!,
      status: "APPROVED"
    },
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
    update: {
      ...req.body,
      status: "PENDING"
    },
    create: {
      ...req.body,
      status: "PENDING",
      userId: req.user!.userId,
      productId: getSingleParam(req.params.id)!
    }
  });

  const productId = getSingleParam(req.params.id)!;
  await syncProductReviewMetrics(productId);

  res.status(StatusCodes.CREATED).json(review);
};

export const adminReviews = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  const search = String(req.query.search ?? "").trim();
  const rating = String(req.query.rating ?? "ALL");
  const status = String(req.query.status ?? "ALL") as "ALL" | ReviewStatus;

  const where = {
    ...(status !== "ALL" ? { status } : {}),
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

export const updateReviewStatus = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const review = await prisma.review.update({
    where: { id },
    data: {
      status: req.body.status
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      product: {
        select: { id: true, name: true, slug: true, sku: true }
      }
    }
  });

  await syncProductReviewMetrics(review.product.id);
  res.json(review);
};

export const deleteReview = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const review = await prisma.review.delete({
    where: { id },
    select: {
      productId: true
    }
  });

  await syncProductReviewMetrics(review.productId);
  res.status(StatusCodes.NO_CONTENT).send();
};
