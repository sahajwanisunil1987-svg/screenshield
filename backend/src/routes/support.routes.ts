import { Router } from "express";
import * as supportController from "../controllers/support.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import {
  adminSupportTicketListSchema,
  createSupportTicketSchema,
  updateSupportTicketSchema
} from "../validation/support.validation.js";

const router = Router();

router.post("/support/tickets", validate({ body: createSupportTicketSchema }), supportController.createSupportTicket);
router.get(
  "/admin/support-tickets",
  authenticate,
  requireAdmin,
  validate({ query: adminSupportTicketListSchema }),
  supportController.adminSupportTickets
);
router.patch(
  "/admin/support-tickets/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: updateSupportTicketSchema }),
  supportController.updateSupportTicket
);

export default router;
