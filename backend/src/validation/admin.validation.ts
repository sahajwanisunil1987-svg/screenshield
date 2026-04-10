import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
};

export const adminDashboardSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d").optional()
});

export const adminInvoiceListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "GENERATED", "PENDING"]).default("ALL").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional()
});

export const adminUserListSchema = z.object({
  search: z.string().optional(),
  activity: z.enum(["ALL", "WITH_ORDERS", "WITHOUT_ORDERS"]).default("ALL").optional(),
  ...paginationFields
});

export const adminInventoryListSchema = z.object({
  search: z.string().optional(),
  stock: z.enum(["ALL", "CRITICAL", "LOW", "HEALTHY"]).default("ALL").optional(),
  ...paginationFields
});


export const adminSupportTicketListSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "NEW", "IN_PROGRESS", "RESOLVED"]).default("ALL").optional(),
  kind: z.enum(["ALL", "ORDER_ISSUE", "RETURN_ISSUE", "PAYMENT_ISSUE", "PRODUCT_INQUIRY", "OTHER"]).default("ALL").optional(),
  ...paginationFields
});


export const adminAccountingSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d").optional()
});


export const adminPurchaseListSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d").optional(),
  vendorId: z.string().optional(),
  ...paginationFields
});

export const adminVendorCreateSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional()
});

export const adminPurchaseCreateSchema = z.object({
  vendorId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().positive(),
  invoiceRef: z.string().optional(),
  notes: z.string().optional(),
  purchasedAt: z.string().datetime().optional()
});

export const adminAppSettingsSchema = z.object({
  siteName: z.string().min(2),
  legalName: z.string().min(2),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(5),
  supportWhatsapp: z.string().min(5),
  supportHours: z.string().min(5),
  addressLine1: z.string().min(2),
  addressLine2: z.string().min(2),
  heroHeading: z.string().min(5),
  heroSubheading: z.string().min(5),
  announcementText: z.string().min(2),
  supportBannerText: z.string().min(2),
  maintenanceMessage: z.string().min(5),
  showDeveloperCredit: z.boolean(),
  developerName: z.string(),
  developerUrl: z.string().url().optional().or(z.literal("")),
  orderPrefix: z.string().trim().min(2).max(6).regex(/^[A-Za-z0-9-]+$/, "Order prefix must be letters, numbers, or hyphen"),
  invoicePrefix: z.string().trim().min(2).max(8).regex(/^[A-Za-z0-9-]+$/, "Invoice prefix must be letters, numbers, or hyphen"),
  invoiceGstin: z.string().trim().min(8).max(20),
  invoiceSupportEmail: z.string().email(),
  invoiceSupportPhone: z.string().min(5),
  invoiceSupplyLabel: z.string().trim().min(5).max(60),
  invoiceAuthorizedSignatory: z.string().trim().min(3).max(60),
  invoiceFooterNote: z.string().min(5),
  invoiceDeclaration: z.string().min(10),
  shippingFee: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0),
  codMaxOrderValue: z.coerce.number().min(0),
  codDisabledPincodes: z.string(),
  returnWindowDays: z.coerce.number().int().min(0).max(30),
  maintenanceMode: z.boolean(),
  allowGuestCheckout: z.boolean(),
  showSupportBanner: z.boolean()
});
