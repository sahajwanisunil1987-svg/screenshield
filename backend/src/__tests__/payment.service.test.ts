import crypto from "crypto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prepareTestEnv } from "./helpers/test-env.js";

const mockRazorpay = () =>
  vi.doMock("../lib/razorpay.js", () => ({
    razorpay: {
      orders: {
        create: vi.fn()
      }
    }
  }));

describe("payment service hardening", () => {
  it("rejects Razorpay order creation for COD orders", async () => {
    prepareTestEnv();

    const prismaMock = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_1",
          status: OrderStatus.PENDING,
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
    mockRazorpay();

    const { createRazorpayOrder } = await import("../services/payment.service.js");

    await expect(createRazorpayOrder("order_1")).rejects.toMatchObject({
      message: "COD orders do not require Razorpay payment"
    });
  });

  it("rejects Razorpay order creation for cancelled orders", async () => {
    prepareTestEnv();

    const prismaMock = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_cancelled",
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING,
          totalAmount: 499,
          orderNumber: "SK-CANCELLED",
          payment: {
            provider: "RAZORPAY",
            status: PaymentStatus.PENDING
          }
        })
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    mockRazorpay();

    const { createRazorpayOrder } = await import("../services/payment.service.js");

    await expect(createRazorpayOrder("order_cancelled")).rejects.toMatchObject({
      message: "Cancelled orders cannot create a Razorpay payment intent"
    });
  });

  it("rejects payment verification when provider order id mismatches", async () => {
    prepareTestEnv();

    const prismaMock = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_2",
          status: OrderStatus.PENDING,
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
    mockRazorpay();

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

  it("rejects payment verification for cancelled orders", async () => {
    prepareTestEnv();

    const prismaMock = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_3",
          status: OrderStatus.CANCELLED,
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
    mockRazorpay();

    const { verifyRazorpayPayment } = await import("../services/payment.service.js");

    await expect(
      verifyRazorpayPayment({
        orderId: "order_3",
        razorpayOrderId: "order_expected",
        razorpayPaymentId: "pay_1",
        razorpaySignature: "sig"
      })
    ).rejects.toMatchObject({
      message: "Cancelled orders cannot be verified as paid"
    });
  });

  it("validates webhook signatures using the configured secret", async () => {
    prepareTestEnv();
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";

    const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    const validSignature = crypto.createHmac("sha256", "webhook-secret").update(body).digest("hex");

    vi.doMock("../lib/prisma.js", () => ({ prisma: {} }));
    mockRazorpay();

    const { verifyRazorpayWebhookSignature } = await import("../services/payment.service.js");

    expect(() => verifyRazorpayWebhookSignature(body, validSignature)).not.toThrow();
    expect(() => verifyRazorpayWebhookSignature(body, "bad-signature")).toThrow(
      "Invalid Razorpay webhook signature"
    );
  });

  it("marks webhook-captured payments as paid", async () => {
    prepareTestEnv();

    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "payment_1",
          provider: "RAZORPAY",
          status: PaymentStatus.PENDING,
          orderId: "order_4",
          order: {
            id: "order_4",
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING
          }
        })
      },
      order: {
        update: vi.fn().mockResolvedValue({})
      }
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation(async (callback) => callback(tx))
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    mockRazorpay();

    const { handleRazorpayWebhook } = await import("../services/payment.service.js");
    const result = await handleRazorpayWebhook({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_2",
            order_id: "order_provider_2"
          }
        }
      }
    });

    expect(result).toMatchObject({
      received: true,
      handled: true,
      updated: true,
      orderId: "order_4",
      alreadyProcessed: false
    });
    expect(tx.order.update).toHaveBeenCalledTimes(1);
  });

  it("ignores webhook updates for cancelled orders", async () => {
    prepareTestEnv();

    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "payment_cancelled",
          provider: "RAZORPAY",
          status: PaymentStatus.PENDING,
          orderId: "order_5",
          order: {
            id: "order_5",
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.PENDING
          }
        })
      },
      order: {
        update: vi.fn()
      }
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation(async (callback) => callback(tx))
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    mockRazorpay();

    const { handleRazorpayWebhook } = await import("../services/payment.service.js");
    const result = await handleRazorpayWebhook({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_cancelled",
            order_id: "order_provider_cancelled"
          }
        }
      }
    });

    expect(result).toMatchObject({
      received: true,
      handled: true,
      updated: false,
      reason: "cancelled_order"
    });
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it("does not downgrade an already paid payment on failed webhook", async () => {
    prepareTestEnv();

    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "payment_paid",
          provider: "RAZORPAY",
          status: PaymentStatus.PAID,
          orderId: "order_6",
          order: {
            id: "order_6",
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID
          }
        })
      },
      order: {
        update: vi.fn()
      }
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation(async (callback) => callback(tx))
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    mockRazorpay();

    const { handleRazorpayWebhook } = await import("../services/payment.service.js");
    const result = await handleRazorpayWebhook({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_paid",
            order_id: "order_provider_paid"
          }
        }
      }
    });

    expect(result).toMatchObject({
      received: true,
      handled: true,
      updated: false,
      reason: "already_paid",
      orderId: "order_6"
    });
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it("treats duplicate captured webhook as already processed", async () => {
    prepareTestEnv();

    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "payment_duplicate",
          provider: "RAZORPAY",
          status: PaymentStatus.PAID,
          orderId: "order_7",
          order: {
            id: "order_7",
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID
          }
        })
      },
      order: {
        update: vi.fn()
      }
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation(async (callback) => callback(tx))
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    mockRazorpay();

    const { handleRazorpayWebhook } = await import("../services/payment.service.js");
    const result = await handleRazorpayWebhook({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_duplicate",
            order_id: "order_provider_duplicate"
          }
        }
      }
    });

    expect(result).toMatchObject({
      received: true,
      handled: true,
      updated: true,
      alreadyProcessed: true,
      orderId: "order_7"
    });
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it("ignores unsupported webhook events safely", async () => {
    prepareTestEnv();

    vi.doMock("../lib/prisma.js", () => ({
      prisma: {
        $transaction: vi.fn()
      }
    }));
    mockRazorpay();

    const { handleRazorpayWebhook } = await import("../services/payment.service.js");
    const result = await handleRazorpayWebhook({
      event: "refund.created",
      payload: {
        payment: {
          entity: {
            id: "pay_ignored",
            order_id: "order_ignored"
          }
        }
      }
    });

    expect(result).toMatchObject({
      received: true,
      handled: false,
      reason: "ignored_event"
    });
  });
});
