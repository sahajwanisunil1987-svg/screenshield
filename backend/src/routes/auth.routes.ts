import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validation/auth.validation.js";

const router = Router();

router.post("/auth/register", validate({ body: registerSchema }), authController.register);
router.post("/auth/login", validate({ body: loginSchema }), authController.login);
router.get("/auth/me", authenticate, authController.me);

export default router;
