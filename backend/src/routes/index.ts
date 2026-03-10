import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import accountRoutes from "./account.routes.js";
import authRoutes from "./auth.routes.js";
import catalogRoutes from "./catalog.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import reviewRoutes from "./review.routes.js";
import supportRoutes from "./support.routes.js";
import uploadRoutes from "./upload.routes.js";
import wishlistRoutes from "./wishlist.routes.js";

const router = Router();

router.use(authRoutes);
router.use(accountRoutes);
router.use(catalogRoutes);
router.use(reviewRoutes);
router.use(supportRoutes);
router.use(orderRoutes);
router.use(paymentRoutes);
router.use(uploadRoutes);
router.use(wishlistRoutes);
router.use(adminRoutes);

export default router;
