import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { uploadRateLimiter } from "../middleware/rate-limit.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/admin/upload", authenticate, requireAdmin, uploadRateLimiter, upload.single("file"), uploadImage);

export default router;
