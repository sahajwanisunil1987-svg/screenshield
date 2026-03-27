import { Prisma } from "@prisma/client";
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

let sponsorTableAvailable: boolean | null = null;

const hasSponsorTable = async () => {
  if (sponsorTableAvailable !== null) {
    return sponsorTableAvailable;
  }

  const result = await prisma.$queryRaw<Array<{ table_name: string | null }>>(
    Prisma.sql`SELECT to_regclass('public."SponsorAd"')::text AS table_name`
  );

  sponsorTableAvailable = Boolean(result[0]?.table_name);
  return sponsorTableAvailable;
};

const isMissingSponsorTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2021" &&
  error.message.includes("SponsorAd");

export const listSponsorAds = async () => {
  if (!(await hasSponsorTable())) {
    return [];
  }

  try {
    return await prisma.sponsorAd.findMany({
      orderBy: [{ isActive: "desc" }, { priority: "desc" }, { updatedAt: "desc" }]
    });
  } catch (error) {
    if (isMissingSponsorTable(error)) {
      return [];
    }

    throw error;
  }
};

export const getSponsorByPlacement = async (placement: SponsorPlacement) => {
  const now = new Date();
  let candidates;

  if (!(await hasSponsorTable())) {
    return null;
  }

  try {
    candidates = await prisma.sponsorAd.findMany({
      where: {
        placement,
        isActive: true
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
    });
  } catch (error) {
    if (isMissingSponsorTable(error)) {
      return null;
    }

    throw error;
  }

  return candidates.find((entry) => isActiveForNow(entry.startAt, entry.endAt, now)) ?? null;
};

export const createSponsorAd = async (input: SponsorInput) => {
  sponsorTableAvailable = true;
  const data = normalizeSponsorInput(input);
  return prisma.sponsorAd.create({ data });
};

export const updateSponsorAd = async (id: string, input: SponsorInput) => {
  sponsorTableAvailable = true;
  const data = normalizeSponsorInput(input);
  return prisma.sponsorAd.update({
    where: { id },
    data
  });
};

export const deleteSponsorAd = async (id: string) => {
  sponsorTableAvailable = true;
  await prisma.sponsorAd.delete({ where: { id } });
};

export const getSponsorBySlug = async (slug: string) =>
  (await hasSponsorTable())
    ? prisma.sponsorAd.findUnique({
        where: { slug }
      }).catch((error) => {
        if (isMissingSponsorTable(error)) {
          sponsorTableAvailable = false;
          return null;
        }

        throw error;
      })
    : null;

export const recordSponsorClick = async (slug: string) =>
  (await hasSponsorTable())
    ? prisma.sponsorAd.update({
        where: { slug },
        data: {
          clickCount: {
            increment: 1
          }
        }
      }).catch((error) => {
        if (isMissingSponsorTable(error)) {
          sponsorTableAvailable = false;
          return null;
        }

        throw error;
      })
    : null;
