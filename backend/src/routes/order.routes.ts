import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import {
  couponSchema,
  couponValidationSchema,
  createOrderSchema,
  inventoryUpdateSchema,
  updateOrderStatusSchema
} from "../validation/order.validation.js";

const router = Router();

router.post("/orders/create", authenticate, validate({ body: createOrderSchema }), orderController.createOrder);
router.get("/orders/my-orders", authenticate, orderController.myOrders);
router.get("/orders/:id", authenticate, validate({ params: idParamSchema }), orderController.getOrder);
router.get("/orders/track/:orderNumber", orderController.trackOrder);
router.post("/coupons/validate", validate({ body: couponValidationSchema }), orderController.validateCoupon);

router.get("/admin/orders", authenticate, requireAdmin, orderController.adminOrders);
router.get("/admin/coupons", authenticate, requireAdmin, orderController.adminCoupons);
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
