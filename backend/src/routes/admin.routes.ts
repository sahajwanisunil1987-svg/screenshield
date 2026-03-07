import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/admin/dashboard", adminController.dashboard);
router.get("/admin/inventory", adminController.inventory);
router.get("/admin/users", adminController.users);
router.get("/admin/orders/:id/invoice", adminController.downloadInvoice);

export default router;
