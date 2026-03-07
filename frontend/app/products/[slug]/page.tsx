import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ProductCard } from "@/components/products/product-card";
import { ProductActions } from "./product-actions";
import { fetchApi } from "@/lib/server-api";
import { formatCurrency } from "@/lib/utils";
import { Product, Review } from "@/types";

export const dynamic = "force-dynamic";

type ProductPayload = {
  product: Product & { reviews: Review[] };
  relatedProducts: Product[];
};

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const payload = await fetchApi<ProductPayload>(`/products/${params.slug}`);

  if (!payload.product) {
    notFound();
  }

  const product = payload.product;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-[36px] bg-white shadow-card">
              <Image
                src={product.images[0]?.url ?? "https://placehold.co/1000x1000"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image, index) => (
                <div key={`${image.url}-${index}`} className="relative aspect-square overflow-hidden rounded-[24px] bg-white shadow-card">
                  <Image src={image.url} alt={image.alt ?? product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6 rounded-[36px] bg-white p-8 shadow-card">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                {product.brand.name} / {product.model.name}
              </p>
              <h1 className="mt-3 font-display text-4xl text-ink">{product.name}</h1>
              <p className="mt-3 text-sm text-slate">{product.shortDescription}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-ink">{formatCurrency(product.price)}</span>
              {product.comparePrice ? (
                <span className="text-lg text-slate line-through">{formatCurrency(product.comparePrice)}</span>
              ) : null}
            </div>
            <div className="grid gap-3 rounded-[28px] bg-[#f5f8fb] p-5 text-sm text-slate sm:grid-cols-2">
              <p>SKU: {product.sku}</p>
              <p>Category: {product.category.name}</p>
              <p>Warranty: {product.warrantyMonths} months</p>
              <p>Availability: {(product.inventory?.stock ?? product.stock) > 0 ? "In stock" : "Out of stock"}</p>
            </div>
            <ProductActions product={product} />
            <div>
              <h2 className="text-lg font-semibold text-ink">Detailed description</h2>
              <p className="mt-3 text-sm leading-7 text-slate">{product.description}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Specifications</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        <section className="mt-14">
          <h2 className="font-display text-3xl text-ink">Customer reviews</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-[28px] bg-white p-6 shadow-card">
                <p className="font-semibold text-ink">{review.user.name}</p>
                <p className="mt-1 text-sm text-slate">{review.comment}</p>
                <p className="mt-2 text-sm text-accent">{review.rating}/5</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-14">
          <h2 className="font-display text-3xl text-ink">Related products</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-4">
            {payload.relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
