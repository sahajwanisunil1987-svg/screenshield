import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createRazorpayOrder,
  handleRazorpayWebhook,
  verifyRazorpayPayment,
  verifyRazorpayWebhookSignature
} from "../services/payment.service.js";

export const createOrder = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await createRazorpayOrder(req.body.orderId));
};

export const verify = async (req: Request, res: Response) => {
  res.json(await verifyRazorpayPayment(req.body));
};

export const webhook = async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  verifyRazorpayWebhookSignature(rawBody, req.header("x-razorpay-signature"));

  const payload = JSON.parse(rawBody.toString("utf8"));
  res.status(StatusCodes.OK).json(await handleRazorpayWebhook(payload));
};
