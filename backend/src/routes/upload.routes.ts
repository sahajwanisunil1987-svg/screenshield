import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/admin/upload", authenticate, requireAdmin, upload.single("file"), uploadImage);

export default router;
