import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

type RateLimitOptions = {
  keyPrefix: string;
  message: string;
  max: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

const getClientKey = (req: Request, keyPrefix: string) => {
  const userKey = req.user?.userId ? `user:${req.user.userId}` : `ip:${req.ip}`;
  return `${keyPrefix}:${userKey}`;
};

const cleanupExpiredBuckets = () => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
    }
  }
};

setInterval(cleanupExpiredBuckets, 60_000).unref();

export const createRateLimiter = ({ keyPrefix, message, max, windowMs }: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs
      });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        message,
        retryAfterSeconds
      });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};

export const authRateLimiter = createRateLimiter({
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again shortly.",
  max: 12,
  windowMs: 15 * 60 * 1000
});

export const searchRateLimiter = createRateLimiter({
  keyPrefix: "search",
  message: "Too many search requests. Please slow down for a moment.",
  max: 180,
  windowMs: 5 * 60 * 1000
});

export const orderRateLimiter = createRateLimiter({
  keyPrefix: "order",
  message: "Too many order actions. Please try again shortly.",
  max: 30,
  windowMs: 10 * 60 * 1000
});

export const paymentRateLimiter = createRateLimiter({
  keyPrefix: "payment",
  message: "Too many payment attempts. Please wait before trying again.",
  max: 25,
  windowMs: 10 * 60 * 1000
});

export const uploadRateLimiter = createRateLimiter({
  keyPrefix: "upload",
  message: "Too many uploads. Please wait before uploading again.",
  max: 20,
  windowMs: 10 * 60 * 1000
});
