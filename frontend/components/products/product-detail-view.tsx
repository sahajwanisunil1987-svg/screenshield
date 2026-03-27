import dynamic from "next/dynamic";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { ProductCardServer } from "@/components/products/product-card-server";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductPurchasePanel } from "@/components/products/product-purchase-panel";
import { buildBreadcrumbStructuredData, buildProductStructuredData } from "@/lib/seo";
import { Product, Review } from "@/types";

const ProductDetailTabs = dynamic(
  () => import("@/app/products/[slug]/product-detail-tabs").then((module) => module.ProductDetailTabs),
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

type ProductPayload = {
  product: Product & { reviews: Review[] };
  relatedProducts: Product[];
};

export function ProductDetailView({ payload }: { payload: ProductPayload }) {
  const product = payload.product;
  const productStructuredData = buildProductStructuredData(product);
  const breadcrumbStructuredData = buildBreadcrumbStructuredData(product);
  const stock = product.inventory?.stock ?? product.stock;
  const compatibleModels = product.compatibilityModels?.map((entry) => entry.model) ?? [product.model];
  const specificationEntries = Object.entries(product.specifications ?? {});
  const quickFacts = [
    { label: "Category", value: product.category.name },
    { label: "Warranty", value: `${product.warrantyMonths} months` },
    { label: "Fitment", value: `${compatibleModels.length} models` },
    { label: "GST", value: `${Number(product.gstRate ?? 18)}%` }
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />
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
          <div className="space-y-5 sm:space-y-6 xl:max-w-[760px]">
            <ProductGallery images={product.images} productName={product.name} videoUrl={product.videoUrl} />
            <div className="xl:hidden">
              <ProductPurchasePanel product={product} />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-card sm:rounded-[20px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">{fact.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{fact.value}</p>
                </div>
              ))}
            </div>
            <section className="grid gap-3 sm:gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-card sm:rounded-[24px] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Compatibility snapshot</h2>
                    <p className="mt-1.5 text-sm text-slate">
                      Designed for {product.brand.name} {product.model.name} and {compatibleModels.length - 1 > 0 ? `${compatibleModels.length - 1} more supported models.` : "the exact listed model."}
                    </p>
                  </div>
                  <div className="rounded-full bg-panel px-3 py-1.5 text-sm font-semibold text-ink">{compatibleModels.length} models</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {compatibleModels.slice(0, 6).map((model) => (
                    <span key={model.id} className="rounded-full bg-panel px-3 py-1.5 text-sm font-semibold text-ink">{model.name}</span>
                  ))}
                  {compatibleModels.length > 6 ? (
                    <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate">+{compatibleModels.length - 6} more</span>
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
          </div>
          <div className="hidden xl:block">
            <ProductPurchasePanel product={product} />
          </div>
        </div>
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
    </PageShell>
  );
}
