import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import { reviewSchema } from "../validation/review.validation.js";

const router = Router();

router.get("/products/:id/reviews", validate({ params: idParamSchema }), reviewController.getReviews);
router.post(
  "/products/:id/reviews",
  authenticate,
  validate({ params: idParamSchema, body: reviewSchema }),
  reviewController.createReview
);

export default router;
