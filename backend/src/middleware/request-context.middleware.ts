import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

const shouldSkipRequestLogging = (path: string) => path === "/api/health";

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  const requestId = req.header("x-request-id") || randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    if (shouldSkipRequestLogging(req.path)) {
      return;
    }

    const durationMs = Date.now() - startedAt;
    const payload = {
      ts: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userId: req.user?.userId ?? null
    };

    console.log(JSON.stringify(payload));
  });

  next();
};
