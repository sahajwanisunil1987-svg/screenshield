import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { getAuthUserById, loginUser, refreshAuthSession, registerUser } from "../services/auth.service.js";
import { ApiError } from "../utils/api-error.js";

const refreshCookieName = "sparekart_refresh";

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.cookie(refreshCookieName, result.refreshToken, getCookieOptions());
  res.status(StatusCodes.CREATED).json({
    token: result.token,
    user: result.user
  });
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.cookie(refreshCookieName, result.refreshToken, getCookieOptions());
  res.status(StatusCodes.OK).json({
    token: result.token,
    user: result.user
  });
};

export const me = async (req: Request, res: Response) => {
  const user = await getAuthUserById(req.user!.userId);
  res.status(StatusCodes.OK).json(user);
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[refreshCookieName];
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Session expired");
  }

  const result = await refreshAuthSession(token);
  res.cookie(refreshCookieName, result.refreshToken, getCookieOptions());
  res.status(StatusCodes.OK).json({
    token: result.token,
    user: result.user
  });
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(refreshCookieName, getCookieOptions());
  res.status(StatusCodes.NO_CONTENT).send();
};
