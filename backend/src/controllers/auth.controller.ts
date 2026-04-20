import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { getAuthUserById, loginUser, refreshAuthSession, registerUser, requestAdminLoginOtp, requestPasswordReset, resendVerificationEmail, resetPassword, verifyAdminLoginOtp, verifyEmail } from "../services/auth.service.js";
import { ApiError } from "../utils/api-error.js";

const refreshCookieName = "sparekart_refresh";

const isProduction = env.NODE_ENV === "production";

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  secure: isProduction,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const getRefreshClearCookieOptions = () => ({
  httpOnly: true,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  secure: isProduction,
  path: "/api/auth"
});

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.cookie(refreshCookieName, result.refreshToken, getRefreshCookieOptions());
  res.status(StatusCodes.CREATED).json({
    token: result.token,
    user: result.user
  });
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.cookie(refreshCookieName, result.refreshToken, getRefreshCookieOptions());
  res.status(StatusCodes.OK).json({
    token: result.token,
    user: result.user
  });
};

export const requestAdminOtp = async (req: Request, res: Response) => {
  const result = await requestAdminLoginOtp(req.body);
  res.status(StatusCodes.OK).json(result);
};

export const verifyAdminOtp = async (req: Request, res: Response) => {
  const result = await verifyAdminLoginOtp(req.body);
  res.cookie(refreshCookieName, result.refreshToken, getRefreshCookieOptions());
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
    res.clearCookie(refreshCookieName, getRefreshClearCookieOptions());
    res.status(StatusCodes.NO_CONTENT).send();
    return;
  }

  try {
    const result = await refreshAuthSession(token);
    res.cookie(refreshCookieName, result.refreshToken, getRefreshCookieOptions());
    res.status(StatusCodes.OK).json({
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === StatusCodes.UNAUTHORIZED) {
      res.clearCookie(refreshCookieName, getRefreshClearCookieOptions());
      res.status(StatusCodes.NO_CONTENT).send();
      return;
    }

    throw error;
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(refreshCookieName, getRefreshClearCookieOptions());
  res.status(StatusCodes.NO_CONTENT).send();
};


export const verifyEmailHandler = async (req: Request, res: Response) => {
  const user = await verifyEmail(req.body.token);
  res.status(StatusCodes.OK).json({ user });
};

export const resendVerificationHandler = async (req: Request, res: Response) => {
  await resendVerificationEmail(req.body.email);
  res.status(StatusCodes.OK).json({ ok: true });
};

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  await requestPasswordReset(req.body.email);
  res.status(StatusCodes.OK).json({ ok: true });
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  await resetPassword(req.body.token, req.body.password);
  res.status(StatusCodes.OK).json({ ok: true });
};
