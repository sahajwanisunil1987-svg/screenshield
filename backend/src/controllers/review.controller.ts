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
