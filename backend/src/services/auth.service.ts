import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const sanitizeUser = <T extends { passwordHash: string }>(user: T) => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "User already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      passwordHash
    }
  });

  return issueAuthPayload(user);
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  return issueAuthPayload(user);
};

export const issueAuthPayload = <T extends { id: string; role: "CUSTOMER" | "ADMIN"; email: string; passwordHash: string }>(
  user: T
) => {
  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email
  };

  return {
    user: sanitizeUser(user),
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};

export const getAuthUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
        select: {
          fullName: true,
          line1: true,
          line2: true,
          landmark: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          gstNumber: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

export const refreshAuthSession = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  });

  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Session expired");
  }

  const next = issueAuthPayload(user);
  const profile = await getAuthUserById(user.id);

  return {
    token: next.token,
    refreshToken: next.refreshToken,
    user: profile
  };
};
