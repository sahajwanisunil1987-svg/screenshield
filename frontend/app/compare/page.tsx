"use client";

import Image from "next/image";
import Link from "next/link";
import { GitCompareArrows, Trash2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCompareStore } from "@/store/compare-store";

export default function ComparePage() {
  const items = useCompareStore((state) => state.items);
  const hasHydrated = useCompareStore((state) => state.hasHydrated);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);

  const specKeys = Array.from(
    new Set(items.flatMap((product) => Object.keys(product.specifications ?? {})))
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              <GitCompareArrows className="h-4 w-4" />
              Product compare
            </p>
            <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">Compare parts side by side</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate">
              Check pricing, stock, warranty, compatibility, and key specifications before you shortlist the right part.
            </p>
          </div>
          {hasHydrated && items.length ? (
            <Button variant="secondary" onClick={clear}>
              Clear compare
            </Button>
          ) : null}
        </div>

        <div className="mt-10">
          {!hasHydrated ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[30px] bg-white p-6 shadow-card">
                  <div className="aspect-[4/3] rounded-[24px] bg-slate-100" />
                  <div className="mt-5 space-y-3">
                    <div className="h-5 w-2/3 rounded-full bg-slate-100" />
                    <div className="h-4 w-1/2 rounded-full bg-slate-100" />
                    <div className="h-4 w-1/3 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : !items.length ? (
            <EmptyState
              title="No products selected for comparison"
              description="Use the compare action on product cards or product pages to build a side-by-side shortlist."
            />
          ) : (
            <div className="space-y-8">
              <div className="grid gap-6 xl:grid-cols-4">
                {items.map((product) => {
                  const stock = product.inventory?.stock ?? product.stock;
                  const compatibilityCount = product.compatibilityModels?.length ?? 0;

                  return (
                    <div key={product.id} className="rounded-[30px] bg-white p-6 shadow-card">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-slate-100">
                        <Image
                          src={product.images[0]?.url ?? "https://placehold.co/600x400"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="mt-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{product.brand.name}</p>
                          <h2 className="mt-2 text-lg font-semibold text-ink">{product.name}</h2>
                          <p className="mt-1 text-sm text-slate">{product.model.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          className="rounded-full border border-slate-200 p-2 text-slate transition hover:bg-accentSoft"
                          aria-label="Remove compared product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate">
                        <p className="text-2xl font-bold text-ink">{formatCurrency(product.price)}</p>
                        <p>SKU {product.sku}</p>
                        <p>{stock > 0 ? `${stock} in stock` : "Out of stock"}</p>
                        <p>{product.warrantyMonths} month warranty</p>
                        <p>{compatibilityCount || 1} compatible model(s)</p>
                      </div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-5 inline-flex rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accentSoft"
                      >
                        Open product
                      </Link>
                    </div>
                  );
                })}
              </div>

              <div className="overflow-x-auto rounded-[32px] bg-white p-4 shadow-card">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white px-4 py-4 font-semibold text-ink">Attribute</th>
                      {items.map((product) => (
                        <th key={product.id} className="px-4 py-4 font-semibold text-ink">
                          {product.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: "Brand",
                        values: items.map((product) => product.brand.name)
                      },
                      {
                        label: "Model",
                        values: items.map((product) => product.model.name)
                      },
                      {
                        label: "Category",
                        values: items.map((product) => product.category.name)
                      },
                      {
                        label: "Price",
                        values: items.map((product) => formatCurrency(product.price))
                      },
                      {
                        label: "Compare price",
                        values: items.map((product) => (product.comparePrice ? formatCurrency(product.comparePrice) : "—"))
                      },
                      {
                        label: "Stock",
                        values: items.map((product) => {
                          const stock = product.inventory?.stock ?? product.stock;
                          return stock > 0 ? `${stock} available` : "Out of stock";
                        })
                      },
                      {
                        label: "Warranty",
                        values: items.map((product) => `${product.warrantyMonths} months`)
                      },
                      {
                        label: "Rating",
                        values: items.map((product) => `${product.averageRating.toFixed(1)} (${product.reviewCount})`)
                      },
                      {
                        label: "Compatibility",
                        values: items.map((product) =>
                          (product.compatibilityModels?.map((entry) => entry.model.name) ?? [product.model.name]).join(", ")
                        )
                      },
                      ...specKeys.map((key) => ({
                        label: key,
                        values: items.map((product) => product.specifications?.[key] ?? "—")
                      }))
                    ].map((row, rowIndex) => (
                      <tr key={row.label}>
                        <td className={`sticky left-0 px-4 py-4 font-semibold text-ink ${rowIndex % 2 === 0 ? "bg-[#f9fbfd]" : "bg-white"}`}>
                          {row.label}
                        </td>
                        {row.values.map((value, index) => (
                          <td
                            key={`${row.label}-${index}`}
                            className={`max-w-xs px-4 py-4 align-top text-slate ${rowIndex % 2 === 0 ? "bg-[#f9fbfd]" : "bg-white"}`}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
