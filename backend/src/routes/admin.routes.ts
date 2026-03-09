import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { adminDashboardSchema, adminInventoryListSchema, adminInvoiceListSchema, adminUserListSchema } from "../validation/admin.validation.js";
import { idParamSchema } from "../validation/common.js";
import { inventoryUpdateSchema } from "../validation/order.validation.js";

const router = Router();

router.get("/admin/dashboard", authenticate, requireAdmin, validate({ query: adminDashboardSchema }), adminController.dashboard);
router.get("/admin/inventory", authenticate, requireAdmin, validate({ query: adminInventoryListSchema }), adminController.inventory);
router.patch("/admin/inventory/:id", authenticate, requireAdmin, validate({ params: idParamSchema, body: inventoryUpdateSchema }), adminController.updateInventory);
router.get("/admin/users", authenticate, requireAdmin, validate({ query: adminUserListSchema }), adminController.users);
router.get("/admin/users/:id", authenticate, requireAdmin, validate({ params: idParamSchema }), adminController.userDetail);
router.get("/admin/invoices", authenticate, requireAdmin, validate({ query: adminInvoiceListSchema }), adminController.invoices);
router.get("/admin/orders/:id/invoice", authenticate, requireAdmin, adminController.downloadInvoice);

export default router;
