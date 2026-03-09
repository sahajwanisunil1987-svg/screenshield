import { Router } from "express";
import * as accountController from "../controllers/account.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import { addressSchema, updateProfileSchema } from "../validation/account.validation.js";

const router = Router();

router.use(authenticate);
router.get("/account/profile", accountController.profile);
router.patch("/account/profile", validate({ body: updateProfileSchema }), accountController.updateProfile);
router.get("/account/addresses", accountController.listAddresses);
router.post("/account/addresses", validate({ body: addressSchema }), accountController.createAddress);
router.patch("/account/addresses/:id", validate({ params: idParamSchema, body: addressSchema.partial().extend({ isDefault: addressSchema.shape.isDefault }) }), accountController.updateAddress);
router.delete("/account/addresses/:id", validate({ params: idParamSchema }), accountController.deleteAddress);
router.get("/account/notifications", accountController.notifications);
router.post("/account/notifications/read-all", accountController.readAllNotifications);
router.post("/account/notifications/:id/read", validate({ params: idParamSchema }), accountController.readNotification);

export default router;
