import { PaymentStatus, Prisma } from "@prisma/client";
import { prepareTestEnv } from "./helpers/test-env.js";

describe("order service", () => {
  it("creates COD orders with invoice and payment metadata", async () => {
    prepareTestEnv();

    const createdOrder = {
      id: "order_cod_1",
      orderNumber: "SK12345678",
      paymentStatus: PaymentStatus.COD,
      items: [],
      payment: {
        provider: "COD",
        status: PaymentStatus.COD
      },
      invoice: {
        invoiceNumber: "INV-2026-1234"
      }
    };

    const prismaMock = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "product_1",
            name: "Vivo Y21 Battery",
            sku: "BAT-Y21",
            price: new Prisma.Decimal(499),
            stock: 10,
            inventory: {
              stock: 10
            }
          }
        ])
      },
      order: {
        create: vi.fn().mockResolvedValue(createdOrder)
      },
      inventory: {
        upsert: vi.fn().mockResolvedValue({})
      },
      coupon: {
        update: vi.fn().mockResolvedValue({})
      },
      address: {
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({})
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    vi.doMock("../utils/helpers.js", () => ({
      createOrderNumber: () => "SK12345678",
      createInvoiceNumber: () => "INV-2026-1234"
    }));

    const { createOrder } = await import("../services/order.service.js");
    const order = await createOrder("user_1", {
      items: [{ productId: "product_1", quantity: 2 }],
      address: {
        fullName: "Sunil",
        line1: "Shop 12",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        phone: "9999999999",
        email: "sunil@example.com"
      },
      paymentMethod: "COD"
    });

    expect(order).toBe(createdOrder);
    expect(prismaMock.order.create).toHaveBeenCalledTimes(1);

    const orderCreateArgs = prismaMock.order.create.mock.calls[0][0];
    expect(orderCreateArgs.data.paymentStatus).toBe(PaymentStatus.COD);
    expect(orderCreateArgs.data.payment.create.provider).toBe("COD");
    expect(orderCreateArgs.data.payment.create.status).toBe(PaymentStatus.COD);
    expect(orderCreateArgs.data.invoice.create.invoiceNumber).toBe("INV-2026-1234");
    expect(prismaMock.inventory.upsert).toHaveBeenCalledTimes(1);
  });

  it("rejects order creation when stock is insufficient", async () => {
    prepareTestEnv();

    const prismaMock = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "product_2",
            name: "iPhone 13 Display",
            sku: "DISP-IP13",
            price: new Prisma.Decimal(2999),
            stock: 1,
            inventory: {
              stock: 1
            }
          }
        ])
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));

    const { createOrder } = await import("../services/order.service.js");

    await expect(
      createOrder("user_2", {
        items: [{ productId: "product_2", quantity: 3 }],
        address: {
          fullName: "Sunil",
          line1: "Shop 12",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          phone: "9999999999"
        },
        paymentMethod: "COD"
      })
    ).rejects.toMatchObject({
      message: "Insufficient stock for iPhone 13 Display"
    });
  });
});
