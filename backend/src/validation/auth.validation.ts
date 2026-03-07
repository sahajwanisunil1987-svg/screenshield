import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10).max(15).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
