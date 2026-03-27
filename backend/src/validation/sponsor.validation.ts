import { z } from "zod";
import { sponsorPlacements } from "../services/sponsor.service.js";

export const sponsorPlacementSchema = z.object({
  placement: z.enum(sponsorPlacements)
});

export const sponsorSchema = z.object({
  name: z.string().min(2).max(80),
  title: z.string().min(6).max(160),
  subtitle: z.string().min(10).max(280),
  ctaLabel: z.string().min(2).max(40),
  targetUrl: z.string().url(),
  desktopImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  mobileImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  placement: z.enum(sponsorPlacements),
  badge: z.string().max(40).optional().nullable().or(z.literal("")),
  priority: z.coerce.number().int().min(0).max(100).default(0),
  startAt: z.string().datetime().optional().nullable().or(z.literal("")),
  endAt: z.string().datetime().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true)
});
