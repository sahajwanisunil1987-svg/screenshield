import { NextFunction, Request, Response } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: "Route not found" });
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      errors: error.flatten()
    });
  }

  if (error instanceof PrismaClientKnownRequestError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: error.message || "Internal server error"
  });
};
