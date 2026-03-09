import { prepareTestEnv } from "./helpers/test-env.js";

const createResponse = () => {
  const response = {
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  return response;
};

describe("admin invoice download", () => {
  it("sends a PDF and updates invoice download metadata", async () => {
    prepareTestEnv();

    const pdfBuffer = Buffer.from("pdf");
    const prismaMock = {
      invoice: {
        update: vi.fn().mockResolvedValue({})
      }
    };

    vi.doMock("../lib/prisma.js", () => ({ prisma: prismaMock }));
    vi.doMock("../services/invoice.service.js", () => ({
      generateInvoicePdfBuffer: vi.fn().mockResolvedValue(pdfBuffer)
    }));

    const { downloadInvoice } = await import("../controllers/admin.controller.js");
    const response = createResponse();

    await downloadInvoice({ params: { id: "order_invoice_1" } } as never, response as never);

    expect(response.headers["Content-Type"]).toBe("application/pdf");
    expect(response.headers["Content-Disposition"]).toBe("attachment; filename=invoice-order_invoice_1.pdf");
    expect(response.body).toBe(pdfBuffer);
    expect(prismaMock.invoice.update).toHaveBeenCalledTimes(1);

    const updateArgs = prismaMock.invoice.update.mock.calls[0][0];
    expect(updateArgs.where.orderId).toBe("order_invoice_1");
    expect(updateArgs.data.downloadCount).toEqual({ increment: 1 });
  });
});
