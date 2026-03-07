import { NextFunction, Request, Response } from "express";

export const asyncHandler =
  <
    TRequest extends Request = Request,
    TResponse extends Response = Response,
    TNext extends NextFunction = NextFunction
  >(
    fn: (req: TRequest, res: TResponse, next: TNext) => Promise<unknown>
  ) =>
  (req: TRequest, res: TResponse, next: TNext) =>
    Promise.resolve(fn(req, res, next)).catch(next);
