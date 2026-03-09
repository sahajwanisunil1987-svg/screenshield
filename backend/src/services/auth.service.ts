import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const sanitizeUser = <T extends { passwordHash: string }>(user: T) => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  addresses: {
    orderBy: [{ isDefault: "desc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      fullName: true,
      line1: true,
      line2: true,
      landmark: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      phone: true,
      gstNumber: true,
      isDefault: true
    }
  }
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
    select: profileSelect
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

export const updateProfile = async (userId: string, payload: { name: string; phone?: string }) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      phone: payload.phone || null
    }
  });

  return getAuthUserById(userId);
};

export const listAddresses = async (userId: string) => {
  const user = await getAuthUserById(userId);
  return user.addresses;
};

const ensureAddressOwnership = async (userId: string, addressId: string) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId }
  });

  if (!address) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Address not found");
  }

  return address;
};

const unsetDefaultAddresses = (userId: string) =>
  prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false }
  });

export const createAddress = async (userId: string, payload: {
  fullName: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  gstNumber?: string;
  isDefault?: boolean;
}) => {
  const existingCount = await prisma.address.count({ where: { userId } });
  const makeDefault = payload.isDefault || existingCount === 0;

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return tx.address.create({
      data: {
        userId,
        fullName: payload.fullName,
        line1: payload.line1,
        line2: payload.line2,
        landmark: payload.landmark,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        country: payload.country || "India",
        phone: payload.phone,
        gstNumber: payload.gstNumber,
        isDefault: makeDefault
      }
    });
  });
};

export const updateAddress = async (userId: string, addressId: string, payload: {
  fullName?: string;
  line1?: string;
  line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  gstNumber?: string;
  isDefault?: boolean;
}) => {
  await ensureAddressOwnership(userId, addressId);

  return prisma.$transaction(async (tx) => {
    if (payload.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: {
        fullName: payload.fullName,
        line1: payload.line1,
        line2: payload.line2,
        landmark: payload.landmark,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        country: payload.country,
        phone: payload.phone,
        gstNumber: payload.gstNumber,
        ...(payload.isDefault !== undefined ? { isDefault: payload.isDefault } : {})
      }
    });
  });
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const address = await ensureAddressOwnership(userId, addressId);

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });

    if (address.isDefault) {
      const nextAddress = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });

      if (nextAddress) {
        await tx.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        });
      }
    }
  });
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
