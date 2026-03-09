import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).optional().or(z.literal(""))
});

export const addressSchema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(5),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(5),
  country: z.string().default("India"),
  phone: z.string().min(10),
  gstNumber: z.string().optional(),
  isDefault: z.boolean().optional()
});

export const markNotificationReadSchema = z.object({
  isRead: z.boolean().default(true)
});
