import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import catalogRoutes from "./catalog.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import reviewRoutes from "./review.routes.js";
import uploadRoutes from "./upload.routes.js";

const router = Router();

router.use(authRoutes);
router.use(catalogRoutes);
router.use(reviewRoutes);
router.use(orderRoutes);
router.use(paymentRoutes);
router.use(uploadRoutes);
router.use(adminRoutes);

export default router;
