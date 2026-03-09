import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { orderRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import {
  adminCouponListSchema,
  adminOrderListSchema,
  couponSchema,
  cancelOrderSchema,
  returnOrderSchema,
  couponValidationSchema,
  createOrderSchema,
  inventoryUpdateSchema,
  updateOrderStatusSchema
} from "../validation/order.validation.js";

const router = Router();

router.post("/orders/create", authenticate, orderRateLimiter, validate({ body: createOrderSchema }), orderController.createOrder);
router.get("/orders/my-orders", authenticate, orderController.myOrders);
router.get("/orders/:id", authenticate, validate({ params: idParamSchema }), orderController.getOrder);
router.get("/orders/:id/invoice", authenticate, validate({ params: idParamSchema }), orderController.downloadMyInvoice);
router.post("/orders/:id/cancel-request", authenticate, validate({ params: idParamSchema, body: cancelOrderSchema }), orderController.cancelRequest);
router.post("/orders/:id/return-request", authenticate, validate({ params: idParamSchema, body: returnOrderSchema }), orderController.returnRequest);
router.get("/orders/track/:orderNumber", orderController.trackOrder);
router.post("/coupons/validate", orderRateLimiter, validate({ body: couponValidationSchema }), orderController.validateCoupon);

router.get(
  "/admin/orders",
  authenticate,
  requireAdmin,
  validate({ query: adminOrderListSchema }),
  orderController.adminOrders
);
router.get(
  "/admin/coupons",
  authenticate,
  requireAdmin,
  validate({ query: adminCouponListSchema }),
  orderController.adminCoupons
);
router.post(
  "/admin/coupons",
  authenticate,
  requireAdmin,
  validate({ body: couponSchema }),
  orderController.createCoupon
);
router.put(
  "/admin/coupons/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: couponSchema }),
  orderController.updateCoupon
);
router.delete(
  "/admin/coupons/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  orderController.deleteCoupon
);
router.patch(
  "/admin/orders/:id/status",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus
);

export default router;
