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
    }
  };

  return response;
};

describe("auth controller", () => {
  it("returns the authenticated user profile from /me flow", async () => {
    prepareTestEnv();

    vi.doMock("../services/auth.service.js", () => ({
      getAuthUserById: vi.fn().mockResolvedValue({
        id: "user_1",
        name: "Sunil",
        email: "sunil@example.com",
        role: "CUSTOMER",
        addresses: [
          {
            fullName: "Sunil",
            line1: "Shop 12"
          }
        ]
      }),
      loginUser: vi.fn(),
      refreshAuthSession: vi.fn(),
      registerUser: vi.fn()
    }));

    const { me } = await import("../controllers/auth.controller.js");
    const response = createResponse();

    await me(
      {
        user: {
          userId: "user_1",
          role: "CUSTOMER",
          email: "sunil@example.com"
        }
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body).toMatchObject({
      id: "user_1",
      email: "sunil@example.com"
    });
  });
});
