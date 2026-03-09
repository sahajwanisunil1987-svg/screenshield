import { prepareTestEnv } from "./helpers/test-env.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    }
  };

  return response;
};

describe("healthCheck", () => {
  it("returns ok when the database probe succeeds", async () => {
    prepareTestEnv();

    const prismaMock = {
      $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }])
    };

    vi.doMock("../lib/prisma.js", () => ({
      prisma: prismaMock
    }));

    const { healthCheck } = await import("../controllers/health.controller.js");
    const response = createResponse();

    await healthCheck({ requestId: "req-ok" } as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({
      status: "ok",
      db: "up",
      requestId: "req-ok"
    });
  });

  it("returns degraded when the database probe fails", async () => {
    prepareTestEnv();

    const prismaMock = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("db offline"))
    };

    vi.doMock("../lib/prisma.js", () => ({
      prisma: prismaMock
    }));

    const { healthCheck } = await import("../controllers/health.controller.js");
    const response = createResponse();

    await healthCheck({ requestId: "req-fail" } as never, response as never);

    expect(response.statusCode).toBe(503);
    expect(response.payload).toMatchObject({
      status: "degraded",
      db: "down",
      requestId: "req-fail",
      message: "db offline"
    });
  });
});
