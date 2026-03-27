import { Router } from "express";
import * as sponsorController from "../controllers/sponsor.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import { sponsorPlacementSchema, sponsorSchema } from "../validation/sponsor.validation.js";

const router = Router();

router.get("/sponsors/:placement", validate({ params: sponsorPlacementSchema }), sponsorController.getSponsorForPlacement);

router.get("/admin/sponsor-ads", authenticate, requireAdmin, sponsorController.listSponsorAds);
router.post("/admin/sponsor-ads", authenticate, requireAdmin, validate({ body: sponsorSchema }), sponsorController.createSponsorAd);
router.put(
  "/admin/sponsor-ads/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: sponsorSchema }),
  sponsorController.updateSponsorAd
);
router.delete(
  "/admin/sponsor-ads/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  sponsorController.deleteSponsorAd
);

export default router;
