import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { loginUser, registerUser } from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(StatusCodes.CREATED).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.status(StatusCodes.OK).json(result);
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
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

  res.status(StatusCodes.OK).json(user);
};
