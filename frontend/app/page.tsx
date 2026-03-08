import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Truck, Wallet, Wrench } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { HeroSearch } from "@/components/home/hero-search";
import { ProductCard } from "@/components/products/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { Brand, Category, MobileModel, ProductListResponse } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mobile Spare Parts Store",
  description:
    "Find mobile spare parts by brand, model, and part type with smart search, featured products, warranty-backed parts, and fast India-wide dispatch."
});

const trustBadges = [
  { icon: ShieldCheck, title: "6 Months Warranty" },
  { icon: Wallet, title: "Secure Payments" },
  { icon: Truck, title: "Fast Delivery" },
  { icon: Wrench, title: "Genuine Parts" }
];

const merchandisingFlows = [
  {
    title: "Display replacements",
    description: "Fast-moving screens and touch combos for the most repaired models.",
    href: "/products?category=lcd-display"
  },
  {
    title: "Battery turnaround",
    description: "Reliable battery picks for repeat workshop replacements and daily demand.",
    href: "/products?search=battery&sort=rating"
  },
  {
    title: "Charging fixes",
    description: "Ports, flex assemblies, and connector parts for common charging faults.",
    href: "/products?search=charging%20port"
  }
];

export default async function HomePage() {
  const [brands, categories, models, featured] = await Promise.all([
    fetchApi<Brand[]>("/brands"),
    fetchApi<Category[]>("/categories"),
    fetchApi<MobileModel[]>("/models"),
    fetchApi<ProductListResponse>("/products?featured=true&limit=4")
  ]);

  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Trusted workshop supply</p>
              <h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">
                Find Your Mobile Spare Parts in Seconds
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/75">
                Verified compatible parts, clear pricing, secure checkout, and fast India-wide dispatch for repair shops and end customers.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">Live catalog</p>
                <p className="mt-3 font-display text-4xl">{featured.pagination.total}+</p>
                <p className="mt-2 text-sm text-white/70">Featured workshop-demand products surfaced from the SpareKart catalog.</p>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">Brand network</p>
                <p className="mt-3 font-display text-4xl">{brands.length}</p>
                <p className="mt-2 text-sm text-white/70">Mobile brands mapped into model-first discovery for quick parts lookup.</p>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">Repair coverage</p>
                <p className="mt-3 font-display text-4xl">{categories.length}</p>
                <p className="mt-2 text-sm text-white/70">Core part types spanning screens, batteries, ports, cameras, and housing parts.</p>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <HeroSearch brands={brands} models={models} categories={categories} />
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {merchandisingFlows.map((flow) => (
              <Link
                key={flow.title}
                href={flow.href}
                className="rounded-[28px] border border-white/10 bg-black/10 p-5 transition hover:-translate-y-1 hover:bg-white/10"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/90">Popular repair flow</p>
                <h3 className="mt-3 font-display text-2xl text-white">{flow.title}</h3>
                <p className="mt-3 text-sm text-white/70">{flow.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular Brands"
          title="Shop by mobile brand"
          description="Start from the manufacturer, narrow to the model, then jump straight into the right spare category."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {brands.map((brand, index) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-card transition hover:-translate-y-1 hover:border-accent/20"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
                {index < 3 ? "High demand" : "Brand catalog"}
              </p>
              <p className="font-display text-xl text-ink">{brand.name}</p>
              <p className="mt-2 text-sm text-slate">{brand.description ?? "Explore compatible models and fast-moving spare parts."}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Categories"
          title="Core spare part types"
          description="Displays, batteries, charging parts, and repair essentials presented in a clean discovery flow."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`rounded-[30px] p-6 shadow-card transition hover:-translate-y-1 ${
                index % 3 === 0
                  ? "bg-[linear-gradient(180deg,#ffffff,#edf8f4)]"
                  : index % 3 === 1
                    ? "bg-[linear-gradient(180deg,#ffffff,#fff3e8)]"
                    : "bg-[linear-gradient(180deg,#ffffff,#edf4fb)]"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Part type</p>
              <p className="font-display text-xl text-ink">{category.name}</p>
              <p className="mt-2 text-sm text-slate">{category.description}</p>
              <p className="mt-4 text-sm font-semibold text-accent">Browse category</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Featured"
          title="Best-selling workshop picks"
          description="High-demand parts with strong quality checks and repeat order performance."
        />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-slate-200/80 bg-panel px-5 py-4 shadow-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Merchandising focus</p>
            <p className="mt-2 text-sm text-slate">
              Curated featured products balanced across trusted brands, high-turnover categories, and workshop-ready compatibility.
            </p>
          </div>
          <Link href="/products?featured=true" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
            View all featured parts
          </Link>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {featured.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[36px] bg-white p-8 shadow-card md:grid-cols-4">
          {trustBadges.map((item) => (
            <div key={item.title} className="rounded-[24px] bg-[#f5f8fb] p-5">
              <item.icon className="h-8 w-8 text-accent" />
              <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
