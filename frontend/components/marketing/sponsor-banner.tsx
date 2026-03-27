import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { SponsorAd } from "@/types";

export function SponsorBanner({ sponsor }: { sponsor: SponsorAd }) {
  return (
    <section className="bg-page-wash">
      <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#07111f_0%,#0f2740_55%,#153c4b_100%)] px-6 py-6 text-white shadow-card sm:px-8 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/90">
                <BadgeCheck className="h-3.5 w-3.5" />
                {sponsor.badge ?? "Sponsored"}
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-2xl leading-tight sm:text-3xl">{sponsor.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">{sponsor.subtitle}</p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <p className="text-sm font-semibold text-cyan-100/90">{sponsor.name}</p>
              <Link
                href={sponsor.targetUrl}
                target="_blank"
                rel="noreferrer sponsored"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cyan-50"
              >
                {sponsor.ctaLabel}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FooterSponsorCard({ sponsor }: { sponsor: SponsorAd }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">{sponsor.badge ?? "Partner"}</p>
      <p className="mt-2 text-base font-semibold text-white">{sponsor.name}</p>
      <p className="mt-2 text-sm leading-6 text-white/68">{sponsor.subtitle}</p>
      <Link
        href={sponsor.targetUrl}
        target="_blank"
        rel="noreferrer sponsored"
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition hover:text-white"
      >
        {sponsor.ctaLabel}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
