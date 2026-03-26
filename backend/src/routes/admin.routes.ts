import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { adminAccountingSchema, adminAppSettingsSchema, adminDashboardSchema, adminInventoryListSchema, adminInvoiceListSchema, adminPurchaseCreateSchema, adminPurchaseListSchema, adminUserListSchema, adminVendorCreateSchema } from "../validation/admin.validation.js";
import { idParamSchema } from "../validation/common.js";
import { inventoryUpdateSchema } from "../validation/order.validation.js";

const router = Router();

router.get("/admin/dashboard", authenticate, requireAdmin, validate({ query: adminDashboardSchema }), adminController.dashboard);
router.get("/admin/accounting", authenticate, requireAdmin, validate({ query: adminAccountingSchema }), adminController.accounting);
router.get("/admin/accounting/export", authenticate, requireAdmin, validate({ query: adminAccountingSchema }), adminController.exportAccounting);
router.get("/admin/purchases", authenticate, requireAdmin, validate({ query: adminPurchaseListSchema }), adminController.purchases);
router.post("/admin/vendors", authenticate, requireAdmin, validate({ body: adminVendorCreateSchema }), adminController.createVendor);
router.post("/admin/purchases", authenticate, requireAdmin, validate({ body: adminPurchaseCreateSchema }), adminController.createPurchase);
router.get("/admin/inventory", authenticate, requireAdmin, validate({ query: adminInventoryListSchema }), adminController.inventory);
router.patch("/admin/inventory/:id", authenticate, requireAdmin, validate({ params: idParamSchema, body: inventoryUpdateSchema }), adminController.updateInventory);
router.get("/admin/users", authenticate, requireAdmin, validate({ query: adminUserListSchema }), adminController.users);
router.get("/admin/users/:id", authenticate, requireAdmin, validate({ params: idParamSchema }), adminController.userDetail);
router.get("/admin/invoices", authenticate, requireAdmin, validate({ query: adminInvoiceListSchema }), adminController.invoices);
router.get("/admin/orders/:id/invoice", authenticate, requireAdmin, adminController.downloadInvoice);
router.get("/admin/settings", authenticate, requireAdmin, adminController.appSettings);
router.put("/admin/settings", authenticate, requireAdmin, validate({ body: adminAppSettingsSchema }), adminController.updateAppSettings);

export default router;
