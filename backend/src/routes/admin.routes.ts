import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { adminDashboardSchema, adminInventoryListSchema, adminInvoiceListSchema, adminUserListSchema } from "../validation/admin.validation.js";
import { idParamSchema } from "../validation/common.js";
import { inventoryUpdateSchema } from "../validation/order.validation.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/admin/dashboard", validate({ query: adminDashboardSchema }), adminController.dashboard);
router.get("/admin/inventory", validate({ query: adminInventoryListSchema }), adminController.inventory);
router.patch("/admin/inventory/:id", validate({ params: idParamSchema, body: inventoryUpdateSchema }), adminController.updateInventory);
router.get("/admin/users", validate({ query: adminUserListSchema }), adminController.users);
router.get("/admin/invoices", validate({ query: adminInvoiceListSchema }), adminController.invoices);
router.get("/admin/orders/:id/invoice", adminController.downloadInvoice);

export default router;
