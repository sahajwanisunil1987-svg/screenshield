import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { paymentRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createRazorpayOrderSchema, verifyRazorpaySchema } from "../validation/payment.validation.js";

const router = Router();

router.post(
  "/payments/razorpay/create-order",
  authenticate,
  paymentRateLimiter,
  validate({ body: createRazorpayOrderSchema }),
  paymentController.createOrder
);
router.post(
  "/payments/razorpay/verify",
  authenticate,
  paymentRateLimiter,
  validate({ body: verifyRazorpaySchema }),
  paymentController.verify
);

export default router;
