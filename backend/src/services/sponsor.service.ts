import { prisma } from "../lib/prisma.js";
import { toSlug } from "../utils/helpers.js";

export const sponsorPlacements = ["home_primary", "footer_partner", "category_top"] as const;
export type SponsorPlacement = (typeof sponsorPlacements)[number];

type SponsorInput = {
  name: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetUrl: string;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  placement: SponsorPlacement;
  badge?: string | null;
  priority?: number;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  isActive?: boolean;
};

const normalizeSponsorInput = (input: SponsorInput) => ({
  name: input.name.trim(),
  slug: toSlug(input.name),
  title: input.title.trim(),
  subtitle: input.subtitle.trim(),
  ctaLabel: input.ctaLabel.trim(),
  targetUrl: input.targetUrl.trim(),
  desktopImageUrl: input.desktopImageUrl?.trim() || null,
  mobileImageUrl: input.mobileImageUrl?.trim() || null,
  placement: input.placement,
  badge: input.badge?.trim() || null,
  priority: input.priority ?? 0,
  startAt: input.startAt ? new Date(input.startAt) : null,
  endAt: input.endAt ? new Date(input.endAt) : null,
  isActive: input.isActive ?? true
});

const isActiveForNow = (startAt: Date | null, endAt: Date | null, now: Date) => {
  if (startAt && startAt > now) {
    return false;
  }

  if (endAt && endAt < now) {
    return false;
  }

  return true;
};

export const listSponsorAds = () =>
  prisma.sponsorAd.findMany({
    orderBy: [{ isActive: "desc" }, { priority: "desc" }, { updatedAt: "desc" }]
  });

export const getSponsorByPlacement = async (placement: SponsorPlacement) => {
  const now = new Date();
  const candidates = await prisma.sponsorAd.findMany({
    where: {
      placement,
      isActive: true
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
  });

  return candidates.find((entry) => isActiveForNow(entry.startAt, entry.endAt, now)) ?? null;
};

export const createSponsorAd = async (input: SponsorInput) => {
  const data = normalizeSponsorInput(input);
  return prisma.sponsorAd.create({ data });
};

export const updateSponsorAd = async (id: string, input: SponsorInput) => {
  const data = normalizeSponsorInput(input);
  return prisma.sponsorAd.update({
    where: { id },
    data
  });
};

export const deleteSponsorAd = async (id: string) => {
  await prisma.sponsorAd.delete({ where: { id } });
};

export const getSponsorBySlug = async (slug: string) =>
  prisma.sponsorAd.findUnique({
    where: { slug }
  });

export const recordSponsorClick = async (slug: string) =>
  prisma.sponsorAd.update({
    where: { slug },
    data: {
      clickCount: {
        increment: 1
      }
    }
  });
