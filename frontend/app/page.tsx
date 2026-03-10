import type { Metadata } from "next";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { ShieldCheck, Truck, Wallet } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ProductCard } from "@/components/products/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { Brand, Category, MobileModel, ProductListResponse } from "@/types";

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

const popularRepairFlows = [
  { label: "Vivo batteries", href: "/brands/vivo/models/vivo-y21" },
  { label: "iPhone displays", href: "/brands/apple/models/iphone-13" },
  { label: "Samsung charging parts", href: "/products?brand=samsung&category=charging-port" }
];

export default async function HomePage() {
  const [brands, categories, models, featured] = await Promise.all([
    fetchApi<Brand[]>("/brands", { cache: "no-store" }),
    fetchApi<Category[]>("/categories", { cache: "no-store" }),
    fetchApi<MobileModel[]>("/models", { cache: "no-store" }),
    fetchApi<ProductListResponse>("/products?featured=true&limit=4", { cache: "no-store" })
  ]);

  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Mobile spare parts</p>
            <h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">
              Choose the brand, pick the model, then find the exact part.
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-white/75">
              SpareKart keeps parts discovery simple for repair shops and customers. Start with the mobile brand, select the model, and move straight into batteries, displays, charging parts, cameras, and more.
            </p>
          </div>
          <div className="mt-10 max-w-6xl">
            <HeroSearch brands={brands} models={models} categories={categories} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/75">
            <span className="font-semibold text-white">Popular flows</span>
            {popularRepairFlows.map((flow) => (
              <Link
                key={flow.label}
                href={flow.href}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold transition hover:bg-white/10 hover:text-white"
              >
                {flow.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular Brands"
          title="Start from the mobile brand"
          description="Open the brand catalog, choose the model, then jump into the right repair part without hunting through unrelated products."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:border-accent/20"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Brand</p>
              <p className="mt-2 font-display text-xl text-ink">{brand.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[32px] bg-white p-6 shadow-card md:grid-cols-3">
          {trustBadges.map((item) => (
            <div key={item.title} className="rounded-[22px] bg-[#f5f8fb] p-5">
              <item.icon className="h-7 w-7 text-accent" />
              <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-slate">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:pb-16">
        <SectionHeading
          eyebrow="Featured"
          title="Fast-moving spare parts"
          description="A short featured strip for high-demand parts. Keep browsing focused, then switch to brand and model for exact compatibility."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {featured.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
