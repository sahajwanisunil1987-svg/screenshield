import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/payment.service.js";

export const createOrder = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await createRazorpayOrder(req.body.orderId));
};

export const verify = async (req: Request, res: Response) => {
  res.json(await verifyRazorpayPayment(req.body));
};
