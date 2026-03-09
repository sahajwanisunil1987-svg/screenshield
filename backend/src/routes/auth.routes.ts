import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from "../validation/auth.validation.js";

const router = Router();

router.post("/auth/register", authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post("/auth/login", authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post("/auth/refresh", authRateLimiter, authController.refresh);
router.post("/auth/logout", authRateLimiter, authController.logout);
router.post("/auth/verify-email", authRateLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmailHandler);
router.post("/auth/resend-verification", authRateLimiter, validate({ body: forgotPasswordSchema }), authController.resendVerificationHandler);
router.post("/auth/forgot-password", authRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPasswordHandler);
router.post("/auth/reset-password", authRateLimiter, validate({ body: resetPasswordSchema }), authController.resetPasswordHandler);
router.get("/auth/me", authenticate, authController.me);

export default router;
