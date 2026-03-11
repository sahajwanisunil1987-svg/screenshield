import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { fetchApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { Brand, Category, MobileModel } from "@/types";

export const dynamic = "force-dynamic";

const HeroSearch = nextDynamic(
  () => import("@/components/home/hero-search").then((module) => module.HeroSearch),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[32px] border border-white/10 bg-white/8 p-5 backdrop-blur md:p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-12 animate-pulse self-end rounded-full bg-white/10" />
        </div>
      </div>
    )
  }
);

export const metadata: Metadata = buildMetadata({
  title: "Mobile Spare Parts Store",
  description:
    "Find mobile spare parts by brand, model, and part type with clear discovery, warranty-backed parts, and fast India-wide dispatch."
});



export default async function HomePage() {
  const [brands, categories, models] = await Promise.all([
    fetchApi<Brand[]>("/brands", { cache: "no-store" }),
    fetchApi<Category[]>("/categories", { cache: "no-store" }),
    fetchApi<MobileModel[]>("/models", { cache: "no-store" })
  ]);

  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Mobile spare parts made easy</p>
            <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              Find the right spare part in three quick steps.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/72 sm:text-base">
              Choose the brand, pick the model, then open batteries, displays, charging parts, cameras, and more.
            </p>
          </div>
          <div className="mt-8 max-w-5xl">
            <HeroSearch brands={brands} models={models} categories={categories} />
          </div>
        </div>
      </section>
      <section className="bg-page-wash">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700/80">Brands</p>
              <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Start from the brand</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate sm:text-base">
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="flex min-h-[164px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white px-5 py-6 text-center shadow-card transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                {brand.logoUrl ? (
                  <div className="relative h-12 w-32">
                    <Image
                      src={brand.logoUrl}
                      alt={`${brand.name} logo`}
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                ) : (
                  <h3 className="font-display text-2xl text-ink">{brand.name}</h3>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </PageShell>
  );
}
