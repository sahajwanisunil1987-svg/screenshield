import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(["silent", "error", "warn", "info"]).default("info"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8).optional(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  SITE_URL: z.string().optional(),
  COMPANY_NAME: z.string().default("SpareKart"),
  COMPANY_LEGAL_NAME: z.string().default("SpareKart Electronics"),
  COMPANY_GSTIN: z.string().default("27ABCDE1234F1Z5"),
  COMPANY_PHONE: z.string().default("+91 99999 99999"),
  COMPANY_EMAIL: z.string().default("support@sparekart.in"),
  COMPANY_ADDRESS_LINE1: z.string().default("Repair Market, Unit 12"),
  COMPANY_ADDRESS_LINE2: z.string().default("Mumbai, Maharashtra 400001"),
  HEALTHCHECK_TOKEN: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().default("rzp_test_xxxxx"),
  RAZORPAY_KEY_SECRET: z.string().default("xxxxxx"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().default("smtp.example.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default("noreply@example.com"),
  SMTP_PASS: z.string().default("password"),
  WHATSAPP_WEBHOOK_URL: z.string().optional(),
  COD_DISABLED_PINCODES: z.string().optional(),
  COD_MAX_ORDER_VALUE: z.coerce.number().default(5000)
});

export const env = envSchema.parse(process.env);
