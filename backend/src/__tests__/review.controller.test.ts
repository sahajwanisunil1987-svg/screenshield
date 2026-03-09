import { StatusCodes } from "http-status-codes";
import { prepareTestEnv } from "./helpers/test-env.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send(payload?: unknown) {
      this.body = payload;
      return this;
    }
  };

  return response;
};

describe("review controller moderation flow", () => {
  it("creates reviews as pending and syncs approved metrics", async () => {
    prepareTestEnv();

    const prismaMock = {
      review: {
        upsert: vi.fn().mockResolvedValue({
          id: "review_1",
          productId: "product_1",
          rating: 5,
          status: "PENDING"
        }),
        findMany: vi.fn().mockResolvedValue([
          { rating: 4 },
          { rating: 5 }
        ])
      },
      product: {
        update: vi.fn().mockResolvedValue({})
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));

    const { createReview } = await import("../controllers/review.controller.js");
    const response = createResponse();

    await createReview(
      {
        params: { id: "product_1" },
        body: { title: "Good", comment: "Working fine", rating: 5 },
        user: { userId: "user_1", role: "CUSTOMER", email: "user@example.com" }
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(StatusCodes.CREATED);
    expect(prismaMock.review.upsert).toHaveBeenCalledTimes(1);
    const upsertArgs = prismaMock.review.upsert.mock.calls[0][0];
    expect(upsertArgs.create.status).toBe("PENDING");
    expect(upsertArgs.update.status).toBe("PENDING");
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: "product_1" },
      data: {
        averageRating: 4.5,
        reviewCount: 2
      }
    });
  });

  it("returns only approved reviews on public fetch", async () => {
    prepareTestEnv();

    const approvedReviews = [
      {
        id: "review_approved",
        title: "Approved",
        status: "APPROVED"
      }
    ];

    const prismaMock = {
      review: {
        findMany: vi.fn().mockResolvedValue(approvedReviews)
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));

    const { getReviews } = await import("../controllers/review.controller.js");
    const response = createResponse();

    await getReviews({ params: { id: "product_2" } } as never, response as never);

    expect(response.body).toBe(approvedReviews);
    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productId: "product_2",
          status: "APPROVED"
        }
      })
    );
  });

  it("updates review status and recalculates product metrics", async () => {
    prepareTestEnv();

    const prismaMock = {
      review: {
        update: vi.fn().mockResolvedValue({
          id: "review_2",
          status: "APPROVED",
          product: {
            id: "product_3",
            name: "Battery",
            slug: "battery",
            sku: "BAT-1"
          },
          user: {
            name: "Sunil",
            email: "sunil@example.com"
          }
        }),
        findMany: vi.fn().mockResolvedValue([{ rating: 3 }, { rating: 5 }, { rating: 4 }])
      },
      product: {
        update: vi.fn().mockResolvedValue({})
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));

    const { updateReviewStatus } = await import("../controllers/review.controller.js");
    const response = createResponse();

    await updateReviewStatus(
      {
        params: { id: "review_2" },
        body: { status: "APPROVED" }
      } as never,
      response as never
    );

    expect(prismaMock.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "review_2" },
        data: { status: "APPROVED" }
      })
    );
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: "product_3" },
      data: {
        averageRating: 4,
        reviewCount: 3
      }
    });
    expect(response.body).toMatchObject({
      id: "review_2",
      status: "APPROVED"
    });
  });
});
