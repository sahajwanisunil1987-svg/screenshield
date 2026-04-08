import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthTokenPayload = {
  userId: string;
  role: "CUSTOMER" | "ADMIN";
  email: string;
};

const refreshSecret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET;

export const signAccessToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

export const signRefreshToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, refreshSecret, { expiresIn: "7d" });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret) as AuthTokenPayload;
