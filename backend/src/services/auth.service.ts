import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { signToken } from "../utils/jwt.js";

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

  const token = signToken({
    userId: user.id,
    role: user.role,
    email: user.email
  });

  return { user: sanitizeUser(user), token };
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

  const token = signToken({
    userId: user.id,
    role: user.role,
    email: user.email
  });

  return { user: sanitizeUser(user), token };
};
