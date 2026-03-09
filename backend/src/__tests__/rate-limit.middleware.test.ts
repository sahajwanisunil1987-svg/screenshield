import { createRateLimiter } from "../middleware/rate-limit.middleware.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  return response;
};

describe("createRateLimiter", () => {
  it("blocks requests after the configured threshold", () => {
    const limiter = createRateLimiter({
      keyPrefix: "test-auth",
      message: "Too many attempts",
      max: 2,
      windowMs: 60_000
    });

    const req = {
      ip: "127.0.0.1",
      user: undefined
    };
    const next = vi.fn();

    limiter(req as never, createResponse() as never, next);
    limiter(req as never, createResponse() as never, next);

    const blockedResponse = createResponse();
    limiter(req as never, blockedResponse as never, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.headers["Retry-After"]).toBeTruthy();
  });
});
