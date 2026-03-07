import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import { inventoryUpdateSchema } from "../validation/order.validation.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/admin/dashboard", adminController.dashboard);
router.get("/admin/inventory", adminController.inventory);
router.patch("/admin/inventory/:id", validate({ params: idParamSchema, body: inventoryUpdateSchema }), adminController.updateInventory);
router.get("/admin/users", adminController.users);
router.get("/admin/orders/:id/invoice", adminController.downloadInvoice);

export default router;
