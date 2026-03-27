import { NextRequest, NextResponse } from "next/server";
import { fetchApi } from "@/lib/server-api";
import { SponsorAd } from "@/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const sponsor = await fetchApi<SponsorAd>(`/sponsor-ads/by-slug/${slug}`, { cache: "no-store" });
    await fetchApi<{ ok: true; targetUrl: string }>(`/sponsor-ads/${slug}/click`, {
      method: "POST",
      cache: "no-store"
    });

    return NextResponse.redirect(sponsor.targetUrl, { status: 307 });
  } catch {
    return NextResponse.redirect("/", { status: 307 });
  }
}
