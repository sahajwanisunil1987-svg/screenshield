import { cache } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ProductCardServer } from "@/components/products/product-card-server";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductActions } from "./product-actions";
import { ProductMobileBar } from "./product-mobile-bar";
import { buildBreadcrumbStructuredData, buildMetadata, buildProductStructuredData } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { formatCurrency } from "@/lib/utils";
import { Product, Review, ShippingSettings } from "@/types";

export const revalidate = 300;

type ProductPayload = {
  product: Product & { reviews: Review[] };
  relatedProducts: Product[];
};

const defaultShippingSettings: ShippingSettings = {
  shippingFee: 79,
  freeShippingThreshold: 999,
  codMaxOrderValue: 5000,
  blockedCodPincodes: ["560001", "110001"]
};

const getProductPayload = cache((slug: string) =>
  fetchApi<ProductPayload>(`/products/${slug}`, { next: { revalidate: 300 } })
);

const getShippingSettings = cache(async () => {
  try {
    return await fetchApi<ShippingSettings>("/settings/shipping", { next: { revalidate: 300 } });
  } catch {
    return defaultShippingSettings;
  }
});

const ProductDetailTabs = dynamic(
  () => import("./product-detail-tabs").then((module) => module.ProductDetailTabs),
  {
    loading: () => (
      <section className="mt-6 sm:mt-10">
        <div className="theme-surface rounded-[24px] p-4 shadow-card sm:rounded-[32px] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-[20px] bg-white/75" />
            ))}
          </div>
        </div>
      </section>
    )
  }
);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const [payload, shippingSettings] = await Promise.all([getProductPayload(params.slug), getShippingSettings()]);
  const product = payload.product;

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: "The requested SpareKart product could not be found."
    });
  }

  return {
    ...buildMetadata({
      title: `${product.name} for ${product.model.name}`,
      description:
        product.shortDescription ||
        `Buy ${product.name} for ${product.model.name} from SpareKart with warranty-backed mobile spare parts and fast dispatch.`
    }),
    openGraph: {
      title: `${product.name} for ${product.model.name} | SpareKart`,
      description:
        product.shortDescription ||
        `Buy ${product.name} for ${product.model.name} from SpareKart with warranty-backed mobile spare parts and fast dispatch.`,
      siteName: "SpareKart",
      type: "website",
      images: product.images[0]?.url ? [{ url: product.images[0].url, alt: product.name }] : undefined
    },
    twitter: {
      card: product.images[0]?.url ? "summary_large_image" : "summary",
      title: `${product.name} for ${product.model.name} | SpareKart`,
      description:
        product.shortDescription ||
        `Buy ${product.name} for ${product.model.name} from SpareKart with warranty-backed mobile spare parts and fast dispatch.`,
      images: product.images[0]?.url ? [product.images[0].url] : undefined
    }
  };
}

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const [payload, shippingSettings] = await Promise.all([getProductPayload(params.slug), getShippingSettings()]);

  if (!payload.product) {
    notFound();
  }

  const product = payload.product;
  const productStructuredData = buildProductStructuredData(product);
  const breadcrumbStructuredData = buildBreadcrumbStructuredData(product);
  const stock = product.inventory?.stock ?? product.stock;
  const savings = product.comparePrice ? Math.max(product.comparePrice - product.price, 0) : 0;
  const compatibleModels = product.compatibilityModels?.map((entry) => entry.model) ?? [product.model];
  const specificationEntries = Object.entries(product.specifications ?? {});
  const quickFacts = [
    { label: "Category", value: product.category.name },
    { label: "Warranty", value: `${product.warrantyMonths} months` },
    { label: "Fitment", value: `${compatibleModels.length} models` },
    { label: "GST", value: `${Number(product.gstRate ?? 18)}%` }
  ];
  const trustPoints = [
    { icon: ShieldCheck, title: `${product.warrantyMonths} month warranty` },
    { icon: Truck, title: `Dispatch in 24-48 working hours${shippingSettings.freeShippingThreshold > 0 ? ` · Free above INR ${shippingSettings.freeShippingThreshold}` : ""}` },
    { icon: BadgeCheck, title: "Compatibility-first cataloging" }
  ];

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-7 pb-28 sm:px-6 sm:py-12 lg:px-8 xl:pb-16">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="transition hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/products" className="transition hover:text-ink">Products</Link>
          <span>/</span>
          <Link href={`/products?brand=${product.brand.slug}`} className="transition hover:text-ink">{product.brand.name}</Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </div>
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,0.96fr)_380px]">
          <div className="space-y-3 sm:space-y-4 xl:max-w-[760px]">
            <ProductGallery images={product.images} productName={product.name} videoUrl={product.videoUrl} />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-card sm:rounded-[20px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">{fact.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="theme-surface space-y-3 rounded-[24px] p-4 shadow-card sm:rounded-[30px] sm:p-5 xl:sticky xl:top-20 xl:self-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
                <span>{product.brand.name}</span>
                <span className="text-slate">/</span>
                <span>{product.model.name}</span>
              </div>
              <h1 className="mt-2.5 font-display text-[1.95rem] leading-[0.95] text-ink sm:text-[3.2rem]">{product.name}</h1>
              <p className="mt-2.5 text-sm leading-6 text-slate">{product.shortDescription}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate">
                <div className="inline-flex items-center gap-2 rounded-full bg-panel px-3 py-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-ink">{product.averageRating?.toFixed(1) ?? "0.0"}</span>
                  <span>from {product.reviewCount} review(s)</span>
                </div>
                <div className={`rounded-full px-3 py-1.5 font-semibold ${stock > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                  {stock > 0 ? `${stock} in stock` : "Currently out of stock"}
                </div>
                {savings > 0 ? (
                  <div className="rounded-full bg-amber-500/15 px-3 py-1.5 font-semibold text-amber-400">
                    Save {formatCurrency(savings)}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-ink">SKU {product.sku}</span>
                <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-ink">{product.category.name}</span>
                <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-ink">{compatibleModels.length} compatible models</span>
              </div>
            </div>
            <div className="rounded-[20px] bg-[linear-gradient(135deg,#07111f,#0f2731)] p-4 text-white sm:rounded-[24px] sm:p-5">
              <div className="flex flex-wrap items-end gap-2.5">
                <span className="text-[2.1rem] font-bold leading-none sm:text-[2.6rem]">{formatCurrency(product.price)}</span>
                <div className="pb-0.5 text-xs text-white/65">
                  <p>Inclusive of catalog pricing</p>
                </div>
              </div>
              {product.comparePrice ? (
                <p className="mt-2 text-xs text-white/60">
                  Compare at <span className="line-through">{formatCurrency(product.comparePrice)}</span>
                </p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {trustPoints.map((item) => (
                  <div key={item.title} className="flex items-center gap-2.5 rounded-[16px] bg-white/8 px-3 py-2.5">
                    <item.icon className="h-4 w-4 shrink-0 text-teal-200" />
                    <p className="text-[13px] font-semibold leading-5">{item.title}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-white/65">
                {shippingSettings.shippingFee === 0
                  ? "Shipping is currently free across eligible orders."
                  : `Standard shipping ${formatCurrency(shippingSettings.shippingFee)}. Final delivery timeline can vary by city and courier serviceability.`}
              </p>
            </div>
            <ProductActions product={product} />
          </div>
        </div>
        <section className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-card sm:rounded-[24px] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Compatibility snapshot</h2>
                <p className="mt-1.5 text-sm text-slate">
                  Designed for {product.brand.name} {product.model.name} and {compatibleModels.length - 1 > 0 ? `${compatibleModels.length - 1} more supported models.` : "the exact listed model."}
                </p>
              </div>
              <div className="rounded-full bg-panel px-3 py-1.5 text-sm font-semibold text-ink">
                {compatibleModels.length} models
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {compatibleModels.slice(0, 6).map((model) => (
                <span key={model.id} className="rounded-full bg-panel px-3 py-1.5 text-sm font-semibold text-ink">
                  {model.name}
                </span>
              ))}
              {compatibleModels.length > 6 ? (
                <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate">
                  +{compatibleModels.length - 6} more
                </span>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 rounded-[22px] bg-panel p-4 text-sm text-slate sm:grid-cols-2 sm:gap-3 sm:rounded-[24px] sm:p-5 lg:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">SKU</p>
              <p className="mt-1.5 font-semibold text-ink">{product.sku}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">GST</p>
              <p className="mt-1.5 font-semibold text-ink">{Number(product.gstRate ?? 18)}%</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Category</p>
              <p className="mt-1.5 font-semibold text-ink">{product.category.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Warranty</p>
              <p className="mt-1.5 font-semibold text-ink">{product.warrantyMonths} months</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Availability</p>
              <p className="mt-1.5 font-semibold text-ink">{stock > 0 ? "Ready to order" : "Notify for restock"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Top specs</p>
              <p className="mt-1.5 font-semibold text-ink">
                {specificationEntries.slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(" • ")}
              </p>
            </div>
          </div>
        </section>
        <ProductDetailTabs
          productId={product.id}
          description={product.description}
          specifications={product.specifications}
          compatibleModels={compatibleModels}
          averageRating={product.averageRating}
          reviewCount={product.reviewCount}
          initialReviews={product.reviews}
        />
        <section className="mt-8 sm:mt-9">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Related products</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {payload.relatedProducts.map((item) => (
              <ProductCardServer key={item.id} product={item} />
            ))}
          </div>
        </section>
      </div>
      <ProductMobileBar product={product} stock={stock} />
    </PageShell>
  );
}
