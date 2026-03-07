import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  RAZORPAY_KEY_ID: z.string().default("rzp_test_xxxxx"),
  RAZORPAY_KEY_SECRET: z.string().default("xxxxxx"),
  AWS_REGION: z.string().default("ap-south-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_PUBLIC_BASE_URL: z.string().url(),
  SMTP_HOST: z.string().default("smtp.example.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default("noreply@example.com"),
  SMTP_PASS: z.string().default("password"),
  WHATSAPP_WEBHOOK_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);
