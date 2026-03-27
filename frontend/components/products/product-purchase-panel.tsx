"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ProductActions } from "@/app/products/[slug]/product-actions";
import { ProductMobileBar } from "@/app/products/[slug]/product-mobile-bar";

const trustPoints = [
  { icon: ShieldCheck, title: "Warranty-backed replacement support" },
  { icon: Truck, title: "Fast dispatch across India" },
  { icon: BadgeCheck, title: "Compatibility-first cataloging" }
];

export function ProductPurchasePanel({ product }: { product: Product }) {
  const defaultVariant = useMemo(
    () => product.variants?.find((variant) => variant.isDefault) ?? product.variants?.[0] ?? null,
    [product.variants]
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id ?? null);

  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!selectedVariantId) {
      return defaultVariant;
    }

    return product.variants?.find((variant) => variant.id === selectedVariantId) ?? defaultVariant;
  }, [defaultVariant, product.variants, selectedVariantId]);

  const displayPrice = selectedVariant?.price ?? product.price;
  const displayComparePrice = selectedVariant?.comparePrice ?? product.comparePrice ?? null;
  const stock = selectedVariant?.stock ?? product.inventory?.stock ?? product.stock;
  const savings = displayComparePrice ? Math.max(displayComparePrice - displayPrice, 0) : 0;
  const sku = selectedVariant?.sku ?? product.sku;
  const variantLabel = product.category.variantLabel?.trim() || "Variant";

  return (
    <>
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
            <div
              className={`rounded-full px-3 py-1.5 font-semibold ${
                stock > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {stock > 0 ? `${stock} in stock` : "Currently out of stock"}
            </div>
            {savings > 0 ? (
              <div className="rounded-full bg-amber-500/15 px-3 py-1.5 font-semibold text-amber-400">
                Save {formatCurrency(savings)}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-ink">SKU {sku}</span>
            <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-ink">{product.category.name}</span>
            {selectedVariant?.label ? (
              <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-ink">
                {variantLabel}: {selectedVariant.label}
              </span>
            ) : null}
          </div>
        </div>
        {product.hasVariants && product.variants?.length ? (
          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">{variantLabel}</p>
                <p className="mt-1 text-sm text-slate">Choose the exact option your customer needs.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.filter((variant) => variant.isActive !== false).map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    selectedVariant?.id === variant.id
                      ? "border-accent bg-accent text-white"
                      : "border-slate-200 bg-panel text-ink hover:border-accent/40"
                  }`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="rounded-[20px] bg-[linear-gradient(135deg,#07111f,#0f2731)] p-4 text-white sm:rounded-[24px] sm:p-5">
          <div className="flex flex-wrap items-end gap-2.5">
            <span className="text-[2.1rem] font-bold leading-none sm:text-[2.6rem]">{formatCurrency(displayPrice)}</span>
            <div className="pb-0.5 text-xs text-white/65">
              <p>Inclusive of catalog pricing</p>
            </div>
          </div>
          {displayComparePrice ? (
            <p className="mt-2 text-xs text-white/60">
              Compare at <span className="line-through">{formatCurrency(displayComparePrice)}</span>
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
        </div>
        <ProductActions product={product} selectedVariant={selectedVariant} />
      </div>
      <ProductMobileBar product={product} stock={stock} price={displayPrice} selectedVariant={selectedVariant} />
    </>
  );
}
