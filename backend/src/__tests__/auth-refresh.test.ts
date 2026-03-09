import { prepareTestEnv } from "./helpers/test-env.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    clearCookie: vi.fn(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload?: unknown) {
      this.body = payload;
      return this;
    }
  };

  return response;
};

describe("refresh", () => {
  it("returns 204 when no refresh cookie is present", async () => {
    prepareTestEnv();

    const { refresh } = await import("../controllers/auth.controller.js");
    const response = createResponse();

    await refresh({ cookies: {} } as never, response as never);

    expect(response.clearCookie).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(204);
    expect(response.body).toBeUndefined();
  });
});
