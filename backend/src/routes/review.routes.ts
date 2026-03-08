import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import { adminReviewListSchema, reviewSchema, reviewStatusSchema } from "../validation/review.validation.js";

const router = Router();

router.get("/products/:id/reviews", validate({ params: idParamSchema }), reviewController.getReviews);
router.post(
  "/products/:id/reviews",
  authenticate,
  validate({ params: idParamSchema, body: reviewSchema }),
  reviewController.createReview
);
router.get(
  "/admin/reviews",
  authenticate,
  requireAdmin,
  validate({ query: adminReviewListSchema }),
  reviewController.adminReviews
);
router.patch(
  "/admin/reviews/:id/status",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: reviewStatusSchema }),
  reviewController.updateReviewStatus
);
router.delete(
  "/admin/reviews/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  reviewController.deleteReview
);

export default router;
