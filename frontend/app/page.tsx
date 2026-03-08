import type { Metadata } from "next";
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
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Trusted workshop supply</p>
            <h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">
              Find Your Mobile Spare Parts in Seconds
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/75">
              Verified compatible parts, clear pricing, secure checkout, and fast India-wide dispatch for repair shops and end customers.
            </p>
          </div>
          <div className="mt-10">
            <HeroSearch brands={brands} models={models} categories={categories} />
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
          {brands.map((brand) => (
            <a
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="rounded-[26px] border border-slate-200 bg-white p-6 text-center shadow-card transition hover:-translate-y-1"
            >
              <p className="font-display text-xl text-ink">{brand.name}</p>
            </a>
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
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="rounded-[30px] bg-white p-6 shadow-card transition hover:-translate-y-1"
            >
              <p className="font-display text-xl text-ink">{category.name}</p>
              <p className="mt-2 text-sm text-slate">{category.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Featured"
          title="Best-selling workshop picks"
          description="High-demand parts with strong quality checks and repeat order performance."
        />
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
