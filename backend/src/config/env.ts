import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const resolveBackendFile = (filename: string) => {
  const candidates = [
    path.resolve(currentDir, "../../", filename),
    path.resolve(currentDir, "../../../backend", filename),
    path.resolve(currentDir, "../../../", filename)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const exampleEnvPath = resolveBackendFile(".env.example");
const localEnvPath = resolveBackendFile(".env");

if (exampleEnvPath) {
  dotenv.config({ path: exampleEnvPath });
}

if (localEnvPath) {
  dotenv.config({ path: localEnvPath, override: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(["silent", "error", "warn", "info"]).default("info"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8).optional(),
  FRONTEND_URL: z.string().min(1),
  SITE_URL: z.string().optional(),
  COMPANY_NAME: z.string().min(1),
  COMPANY_LEGAL_NAME: z.string().min(1),
  COMPANY_GSTIN: z.string().min(1),
  COMPANY_PHONE: z.string().min(1),
  COMPANY_EMAIL: z.string().email(),
  COMPANY_ADDRESS_LINE1: z.string().min(1),
  COMPANY_ADDRESS_LINE2: z.string().min(1),
  HEALTHCHECK_TOKEN: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  WHATSAPP_WEBHOOK_URL: z.string().optional(),
  COD_DISABLED_PINCODES: z.string().optional(),
  COD_MAX_ORDER_VALUE: z.coerce.number().default(5000)
});

export const env = envSchema.parse(process.env);
