import { Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export const healthCheck = async (req: Request, res: Response) => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      service: "sparekart-api",
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      db: "up",
      responseTimeMs: Date.now() - startedAt,
      requestId: req.requestId
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      service: "sparekart-api",
      environment: env.NODE_ENV,
      db: "down",
      responseTimeMs: Date.now() - startedAt,
      requestId: req.requestId,
      message: error instanceof Error ? error.message : "Database unavailable"
    });
  }
};
