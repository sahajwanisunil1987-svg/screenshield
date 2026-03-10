import type { Metadata } from "next";
import Link from "next/link";
import { Headphones, ShieldCheck, Truck, Wallet, Wrench } from "lucide-react";
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
  { icon: ShieldCheck, title: "6 Months Warranty", detail: "Covered parts for confident replacement orders." },
  { icon: Wallet, title: "Secure Payments", detail: "Trusted checkout flow for online orders and COD support." },
  { icon: Truck, title: "Fast Delivery", detail: "Dispatch-oriented workflow built for urgent repair demand." },
  { icon: Wrench, title: "Genuine Parts", detail: "Catalog built around verified fitment and repair confidence." }
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

const supportPoints = [
  {
    title: "Repair-shop support",
    detail: "Start with the model and issue type to narrow down the right replacement faster."
  },
  {
    title: "Returns clarity",
    detail: "Compatibility context and warranty cues reduce wrong-part ordering risk."
  },
  {
    title: "Order confidence",
    detail: "Track every order and payment state from one clear storefront flow."
  }
];

export default async function HomePage() {
  const [brands, categories, models, featured] = await Promise.all([
    fetchApi<Brand[]>("/brands", { cache: "no-store", next: { revalidate: 0 } }),
    fetchApi<Category[]>("/categories", { cache: "no-store", next: { revalidate: 0 } }),
    fetchApi<MobileModel[]>("/models", { cache: "no-store", next: { revalidate: 0 } }),
    fetchApi<ProductListResponse>("/products?featured=true&limit=4", { cache: "no-store", next: { revalidate: 0 } })
  ]);

  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-1 lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Trusted workshop supply</p>
              <h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">
                Find Your Mobile Spare Parts in Seconds
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/75">
                Verified compatible parts, clear pricing, secure checkout, and fast India-wide dispatch for repair shops and end customers.
              </p>
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
              <p className="mt-2 text-sm text-slate">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid gap-6 rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,#fffdf8,#eef6fb)] p-8 shadow-card lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              <Headphones className="h-4 w-4" />
              Support confidence
            </p>
            <h2 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Built for repair shops, clear enough for retail buyers.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate">
              SpareKart is designed to reduce parts confusion with clearer discovery, stronger trust cues, and a guided path from search to order tracking.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/track-order" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
                Track an order
              </Link>
              <Link href="/products" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/20 hover:bg-accentSoft">
                Explore catalog
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {supportPoints.map((point) => (
              <div key={point.title} className="rounded-[24px] bg-white/90 p-5 shadow-sm">
                <p className="text-sm font-semibold text-ink">{point.title}</p>
                <p className="mt-2 text-sm text-slate">{point.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
