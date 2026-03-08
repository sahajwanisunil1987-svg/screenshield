import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";

const router = Router();

router.get("/wishlist", authenticate, wishlistController.list);
router.post("/wishlist/:id", authenticate, validate({ params: idParamSchema }), wishlistController.add);
router.delete("/wishlist/:id", authenticate, validate({ params: idParamSchema }), wishlistController.remove);

export default router;
