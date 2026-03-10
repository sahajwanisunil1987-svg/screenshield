import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { ShieldCheck, Truck, Wallet } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
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

const trustBadges = [
  { icon: ShieldCheck, title: "Verified fitment", detail: "Model-led catalog flow for fewer wrong-part orders." },
  { icon: Wallet, title: "COD ready", detail: "Simple checkout flow for workshop buyers and direct customers." },
  { icon: Truck, title: "Fast dispatch", detail: "Quick-moving spare part catalog built for urgent repairs." }
];


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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="theme-surface grid gap-4 rounded-[32px] p-6 md:grid-cols-3">
          {trustBadges.map((item) => (
            <div key={item.title} className="rounded-[22px] bg-[#f5f8fb] p-5 dark:bg-transparent">
              <item.icon className="h-7 w-7 text-accent" />
              <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-slate">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

    </PageShell>
  );
}
