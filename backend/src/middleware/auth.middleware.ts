import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : req.cookies?.token;

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  req.user = {
    userId: payload.userId,
    role: payload.role,
    email: payload.email
  };

  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(StatusCodes.FORBIDDEN).json({ message: "Admin access required" });
  }

  next();
};
