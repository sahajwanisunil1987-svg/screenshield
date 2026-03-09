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
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const logPayload = {
    ts: new Date().toISOString(),
    level: "error",
    requestId: req.requestId ?? null,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.userId ?? null,
    error: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  };

  if (error instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      errors: error.flatten(),
      requestId: req.requestId
    });
  }

  if (error instanceof PrismaClientKnownRequestError) {
    console.error(JSON.stringify({ ...logPayload, code: error.code }));
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      code: error.code,
      requestId: req.requestId
    });
  }

  if (error instanceof ApiError) {
    console.error(JSON.stringify({ ...logPayload, statusCode: error.statusCode }));
    return res.status(error.statusCode).json({ message: error.message, requestId: req.requestId });
  }

  console.error(JSON.stringify(logPayload));
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: error.message || "Internal server error",
    requestId: req.requestId
  });
};
