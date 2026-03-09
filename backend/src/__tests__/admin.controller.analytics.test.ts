import { prepareTestEnv } from "./helpers/test-env.js";

const createResponse = () => {
  const response = {
    body: undefined as unknown,
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  return response;
};

describe("admin dashboard analytics", () => {
  it("returns range-based dashboard stats and trend data", async () => {
    prepareTestEnv();

    const now = new Date("2026-03-09T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const prismaMock = {
      order: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "recent_1",
              createdAt: now,
              user: { name: "Sunil" }
            }
          ])
          .mockResolvedValueOnce([
            {
              id: "order_1",
              totalAmount: 500,
              createdAt: new Date("2026-03-08T10:00:00.000Z"),
              status: "DELIVERED",
              paymentStatus: "PAID",
              userId: "user_1"
            },
            {
              id: "order_2",
              totalAmount: 700,
              createdAt: new Date("2026-03-09T10:00:00.000Z"),
              status: "CONFIRMED",
              paymentStatus: "PAID",
              userId: "user_2"
            }
          ]),
        aggregate: vi.fn().mockResolvedValue({
          _sum: {
            totalAmount: new Number(1200)
          }
        })
      },
      product: {
        count: vi.fn().mockResolvedValue(25)
      },
      inventory: {
        findMany: vi.fn().mockResolvedValue([{ id: "inventory_1", product: { name: "Battery" } }])
      },
      orderItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            productId: "product_1",
            quantity: 3,
            product: {
              name: "Battery",
              brand: { name: "Vivo" },
              category: { name: "Battery" },
              model: { name: "Y21" }
            }
          },
          {
            productId: "product_1",
            quantity: 2,
            product: {
              name: "Battery",
              brand: { name: "Vivo" },
              category: { name: "Battery" },
              model: { name: "Y21" }
            }
          }
        ])
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "user_1",
            name: "Sunil",
            email: "sunil@example.com",
            createdAt: now
          }
        ]),
        count: vi.fn().mockResolvedValue(2)
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));

    const { dashboard } = await import("../controllers/admin.controller.js");
    const response = createResponse();

    await dashboard({ query: { range: "7d" } } as never, response as never);

    expect(response.body).toMatchObject({
      range: "7d",
      stats: {
        totalOrders: 2,
        totalProducts: 25,
        totalRevenue: 1200,
        lowStockCount: 1,
        newCustomers: 2,
        averageOrderValue: 600
      },
      topBrands: [{ name: "Vivo", quantity: 5 }],
      topCategories: [{ name: "Battery", quantity: 5 }],
      topModels: [{ name: "Y21", quantity: 5 }],
      topProducts: [{ productId: "product_1", productName: "Battery", quantity: 5 }]
    });

    const body = response.body as { trend: Array<{ orders: number; revenue: number }> };
    expect(body.trend.some((entry) => entry.orders > 0)).toBe(true);

    vi.useRealTimers();
  });
});
