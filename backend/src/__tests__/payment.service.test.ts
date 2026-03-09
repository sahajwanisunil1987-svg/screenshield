import crypto from "crypto";
import { PaymentStatus } from "@prisma/client";
import { prepareTestEnv } from "./helpers/test-env.js";

describe("payment service hardening", () => {
  it("rejects Razorpay order creation for COD orders", async () => {
    prepareTestEnv();

    const prismaMock = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_1",
          paymentStatus: PaymentStatus.COD,
          totalAmount: 499,
          orderNumber: "SK-1",
          payment: {
            provider: "COD",
            status: PaymentStatus.COD
          }
        })
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    vi.doMock("../lib/razorpay.js", () => ({
      razorpay: {
        orders: {
          create: vi.fn()
        }
      }
    }));

    const { createRazorpayOrder } = await import("../services/payment.service.js");

    await expect(createRazorpayOrder("order_1")).rejects.toMatchObject({
      message: "COD orders do not require Razorpay payment"
    });
  });

  it("rejects payment verification when provider order id mismatches", async () => {
    prepareTestEnv();

    const prismaMock = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_2",
          paymentStatus: PaymentStatus.PENDING,
          payment: {
            provider: "RAZORPAY",
            status: PaymentStatus.PENDING,
            providerOrderId: "order_expected"
          }
        }),
        update: vi.fn()
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    vi.doMock("../lib/razorpay.js", () => ({
      razorpay: {
        orders: {
          create: vi.fn()
        }
      }
    }));

    const { verifyRazorpayPayment } = await import("../services/payment.service.js");

    await expect(
      verifyRazorpayPayment({
        orderId: "order_2",
        razorpayOrderId: "wrong_order",
        razorpayPaymentId: "pay_1",
        razorpaySignature: "sig"
      })
    ).rejects.toMatchObject({
      message: "Razorpay order does not match the existing payment intent"
    });
  });

  it("validates webhook signatures using the configured secret", async () => {
    prepareTestEnv();
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";

    const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    const validSignature = crypto.createHmac("sha256", "webhook-secret").update(body).digest("hex");

    const prismaMock = {};

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    vi.doMock("../lib/razorpay.js", () => ({
      razorpay: {
        orders: {
          create: vi.fn()
        }
      }
    }));

    const { verifyRazorpayWebhookSignature } = await import("../services/payment.service.js");

    expect(() => verifyRazorpayWebhookSignature(body, validSignature)).not.toThrow();
    expect(() => verifyRazorpayWebhookSignature(body, "bad-signature")).toThrow(
      "Invalid Razorpay webhook signature"
    );
  });
});
