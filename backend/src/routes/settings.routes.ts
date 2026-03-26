import { Router } from "express";
import { getAppSettings } from "../controllers/settings.controller.js";

const router = Router();

router.get("/settings/app", getAppSettings);

export default router;
