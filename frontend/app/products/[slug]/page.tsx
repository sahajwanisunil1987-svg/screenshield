import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ProductCard } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { ReviewPanel } from "@/components/products/review-panel";
import { ProductActions } from "./product-actions";
import { buildBreadcrumbStructuredData, buildMetadata, buildProductStructuredData } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { formatCurrency } from "@/lib/utils";
import { Product, Review } from "@/types";

export const dynamic = "force-dynamic";

type ProductPayload = {
  product: Product & { reviews: Review[] };
  relatedProducts: Product[];
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const payload = await fetchApi<ProductPayload>(`/products/${params.slug}`, { cache: "no-store", next: { revalidate: 0 } });
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
  const payload = await fetchApi<ProductPayload>(`/products/${params.slug}`, { cache: "no-store", next: { revalidate: 0 } });

  if (!payload.product) {
    notFound();
  }

  const product = payload.product;
  const productStructuredData = buildProductStructuredData(product);
  const breadcrumbStructuredData = buildBreadcrumbStructuredData(product);
  const stock = product.inventory?.stock ?? product.stock;
  const savings = product.comparePrice ? Math.max(product.comparePrice - product.price, 0) : 0;
  const compatibleModels = product.compatibilityModels?.map((entry) => entry.model) ?? [product.model];
  const trustPoints = [
    { icon: ShieldCheck, title: `${product.warrantyMonths} month warranty` },
    { icon: Truck, title: "Fast dispatch across India" },
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
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-slate">
          <Link href="/" className="transition hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/products" className="transition hover:text-ink">Products</Link>
          <span>/</span>
          <Link href={`/products?brand=${product.brand.slug}`} className="transition hover:text-ink">{product.brand.name}</Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <ProductGallery images={product.images} productName={product.name} videoUrl={product.videoUrl} />
          <div className="space-y-6 rounded-[40px] bg-white p-6 shadow-card sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                <span>{product.brand.name}</span>
                <span className="text-slate">/</span>
                <span>{product.model.name}</span>
              </div>
              <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">{product.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate">{product.shortDescription}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f8fb] px-4 py-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-ink">{product.averageRating?.toFixed(1) ?? "0.0"}</span>
                  <span>from {product.reviewCount} review(s)</span>
                </div>
                <div className={`rounded-full px-4 py-2 font-semibold ${stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {stock > 0 ? `${stock} in stock` : "Currently out of stock"}
                </div>
                {savings > 0 ? (
                  <div className="rounded-full bg-amber-50 px-4 py-2 font-semibold text-amber-700">
                    Save {formatCurrency(savings)}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-[32px] bg-[linear-gradient(135deg,#07111f,#0f2731)] p-6 text-white">
              <div className="flex flex-wrap items-end gap-4">
                <span className="text-4xl font-bold">{formatCurrency(product.price)}</span>
                <div className="pb-1 text-sm text-white/65">
                  <p>Inclusive of catalog pricing</p>
                </div>
              </div>
              {product.comparePrice ? (
                <p className="mt-2 text-sm text-white/60">
                  Compare at <span className="line-through">{formatCurrency(product.comparePrice)}</span>
                </p>
              ) : null}
              <div className="mt-5 grid gap-3">
                {trustPoints.map((item) => (
                  <div key={item.title} className="rounded-[22px] bg-white/8 p-4">
                    <item.icon className="h-5 w-5 text-teal-200" />
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 rounded-[28px] bg-[#f5f8fb] p-5 text-sm text-slate">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">SKU</p>
                <p className="mt-2 font-semibold text-ink">{product.sku}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Category</p>
                <p className="mt-2 font-semibold text-ink">{product.category.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Warranty</p>
                <p className="mt-2 font-semibold text-ink">{product.warrantyMonths} months</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Availability</p>
                <p className="mt-2 font-semibold text-ink">{stock > 0 ? "Ready to order" : "Notify for restock"}</p>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-ink">Compatibility</h2>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-[#f5f8fb] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate">Brand</p>
                  <p className="mt-2 font-semibold text-ink">{product.brand.name}</p>
                </div>
                <div className="rounded-2xl bg-[#f5f8fb] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate">Compatible models</p>
                  <p className="mt-2 font-semibold text-ink">
                    {compatibleModels.slice(0, 3).map((model) => model.name).join(", ")}
                  </p>
                  {compatibleModels.length > 3 ? (
                    <p className="mt-1 text-xs text-slate">+{compatibleModels.length - 3} more supported variants</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-[#f5f8fb] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate">Part type</p>
                  <p className="mt-2 font-semibold text-ink">{product.category.name}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-[#f5f8fb] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate">Supported model list</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {compatibleModels.map((model) => (
                    <span key={model.id} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm">
                      {model.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ProductActions product={product} />
            <div>
              <h2 className="text-lg font-semibold text-ink">Detailed description</h2>
              <p className="mt-3 text-sm leading-7 text-slate">{product.description}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Specifications</h2>
              <div className="mt-4 grid gap-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate">{key}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <ReviewPanel
          productId={product.id}
          initialReviews={product.reviews}
          averageRating={product.averageRating}
          reviewCount={product.reviewCount}
        />
        <section className="mt-14">
          <h2 className="font-display text-3xl text-ink">Related products</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {payload.relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
