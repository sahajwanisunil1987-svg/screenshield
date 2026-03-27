import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { PageShell } from "@/components/layout/page-shell";
import { SponsorBanner } from "@/components/marketing/sponsor-banner";
import { fetchApiOrFallback } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { getSponsorByPlacement } from "@/lib/sponsor-config";
import { Brand, Category, MobileModel, SponsorAd } from "@/types";

export const revalidate = 300;


const BRAND_LOGO_STYLES: Record<string, { wrapper: string; image: string }> = {
  apple: {
    wrapper: "bg-white/95 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    image: "p-3"
  },
  motorola: {
    wrapper: "bg-transparent border border-white/0",
    image: "p-2 drop-shadow-[0_4px_14px_rgba(255,255,255,0.12)]"
  },
  nothing: {
    wrapper: "bg-white/95 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    image: "p-3"
  },
  oneplus: {
    wrapper: "bg-white/95 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    image: "p-3"
  },
  oppo: {
    wrapper: "bg-white/95 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    image: "p-3"
  },
  realme: {
    wrapper: "bg-transparent border border-white/0",
    image: "p-2 drop-shadow-[0_4px_14px_rgba(255,255,255,0.12)]"
  },
  samsung: {
    wrapper: "bg-transparent border border-white/0",
    image: "p-2 drop-shadow-[0_4px_14px_rgba(255,255,255,0.12)]"
  },
  vivo: {
    wrapper: "bg-transparent border border-white/0",
    image: "p-2 drop-shadow-[0_4px_14px_rgba(255,255,255,0.12)]"
  },
  xiaomi: {
    wrapper: "bg-white/95 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    image: "p-3"
  }
};

export const metadata: Metadata = buildMetadata({
  title: "PurjiX Mobile Spare Parts",
  description:
    "PurjiX helps you find mobile spare parts by brand, model, and part type with fast discovery, warranty-backed sourcing, and India-wide dispatch."
});



export default async function HomePage() {
  const [brands, categories, models, remoteSponsor] = await Promise.all([
    fetchApiOrFallback<Brand[]>("/brands", []),
    fetchApiOrFallback<Category[]>("/categories", []),
    fetchApiOrFallback<MobileModel[]>("/models", []),
    fetchApiOrFallback<SponsorAd | null>("/sponsors/home_primary", null)
  ]);
  const homeSponsor = remoteSponsor ?? getSponsorByPlacement("home_primary");

  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-teal-200 sm:text-sm">Mobile spare parts made easy</p>
            <h1 className="mt-3 font-display text-[2.35rem] leading-[1.02] sm:mt-4 sm:text-4xl">
              Find the right spare part in three quick steps.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 sm:mt-4 sm:text-base">
              Choose the brand, pick the model, then open batteries, displays, charging parts, cameras, and more.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 sm:mt-5 sm:text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Brand to model flow</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Repair-shop friendly</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Fast part discovery</span>
            </div>
          </div>
          <div className="mt-6 max-w-5xl sm:mt-8">
            <HeroSearch brands={brands} models={models} categories={categories} />
          </div>
        </div>
      </section>
      {homeSponsor ? <SponsorBanner sponsor={homeSponsor} /> : null}
      <section className="bg-page-wash">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700/80 sm:text-sm">Brands</p>
              <h2 className="mt-2.5 font-display text-[2rem] text-ink sm:mt-3 sm:text-4xl">Start from the brand</h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate sm:mt-3 sm:text-base">
                Open the brand catalog first, choose the model next, then jump straight into the right spare part.
              </p>
            </div>
            <Link
              href="/brands"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-300 hover:bg-slate-50"
            >
              View all brands
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {brands.map((brand) => {
              const logoStyle = BRAND_LOGO_STYLES[brand.slug] ?? {
                wrapper: "bg-transparent border border-white/0",
                image: "p-2 drop-shadow-[0_4px_14px_rgba(255,255,255,0.12)]"
              };

              return (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.slug}`}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-[22px] border border-white/20 bg-white/[0.03] p-2.5 text-center shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-white/35 hover:bg-white/[0.05] hover:shadow-[0_22px_42px_rgba(15,23,42,0.18)] sm:rounded-[24px] sm:p-3"
                >
                  <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_52%)] opacity-70 transition duration-200 group-hover:opacity-100" />
                  {brand.logoUrl ? (
                    <div className={`relative flex h-full max-h-[84px] w-full max-w-[138px] items-center justify-center rounded-[20px] transition duration-200 group-hover:scale-[1.03] sm:max-h-[92px] sm:max-w-[150px] ${logoStyle.wrapper}`}>
                      <div className={`relative h-full w-full ${logoStyle.image}`}>
                        <Image
                          src={brand.logoUrl}
                          alt={`${brand.name} logo`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 138px, 150px"
                        />
                      </div>
                    </div>
                  ) : (
                    <h3 className="relative font-display text-lg text-ink transition duration-200 group-hover:scale-[1.03] sm:text-xl">
                      {brand.name}
                    </h3>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

    </PageShell>
  );
}
