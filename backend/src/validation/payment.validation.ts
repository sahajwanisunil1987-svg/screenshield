import { z } from "zod";

export const createRazorpayOrderSchema = z.object({
  orderId: z.string().min(1)
});

export const cancelRazorpayOrderSchema = z.object({
  orderId: z.string().min(1)
});

export const verifyRazorpaySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1)
});
