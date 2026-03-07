import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createRazorpayOrderSchema, verifyRazorpaySchema } from "../validation/payment.validation.js";

const router = Router();

router.post(
  "/payments/razorpay/create-order",
  authenticate,
  validate({ body: createRazorpayOrderSchema }),
  paymentController.createOrder
);
router.post(
  "/payments/razorpay/verify",
  authenticate,
  validate({ body: verifyRazorpaySchema }),
  paymentController.verify
);

export default router;
