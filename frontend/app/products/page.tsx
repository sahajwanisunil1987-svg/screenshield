import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { CatalogFilters } from "@/components/products/catalog-filters";
import { CatalogSort } from "@/components/products/catalog-sort";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { Brand, Category, MobileModel, ProductListResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: { brand?: string; model?: string; category?: string; search?: string; page?: string; sort?: string };
}): Promise<Metadata> {
  const segments = [searchParams.brand, searchParams.model, searchParams.category, searchParams.search].filter(Boolean);
  const titleBase = segments.length ? `${segments.join(" / ")} Parts` : "Mobile Spare Parts Catalog";
  const title = searchParams.page ? `${titleBase} Page ${searchParams.page}` : titleBase;
  const description = segments.length
    ? `Browse SpareKart results for ${segments.join(", ")} with SSR-friendly filters, compatible spare parts, and SKU-aware product discovery.`
    : "Browse the SpareKart mobile spare parts catalog with brand, model, category, and keyword filters.";

  return buildMetadata({ title, description });
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { brand?: string; model?: string; category?: string; search?: string; page?: string; sort?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.brand) params.set("brand", searchParams.brand);
  if (searchParams.model) params.set("model", searchParams.model);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.search) params.set("search", searchParams.search);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.page) params.set("page", searchParams.page);

  const [products, brands, models, categories] = await Promise.all([
    fetchApi<ProductListResponse>(`/products?${params.toString()}`),
    fetchApi<Brand[]>("/brands"),
    fetchApi<MobileModel[]>("/models"),
    fetchApi<Category[]>("/categories")
  ]);

  const activeFilters = [
    searchParams.brand ? { key: "brand", label: searchParams.brand } : null,
    searchParams.model ? { key: "model", label: searchParams.model } : null,
    searchParams.category ? { key: "category", label: searchParams.category } : null,
    searchParams.search ? { key: "search", label: searchParams.search } : null
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const buildPageHref = (nextPage: number) => {
    const next = new URLSearchParams(params.toString());
    if (nextPage > 1) {
      next.set("page", String(nextPage));
    } else {
      next.delete("page");
    }

    const query = next.toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  const buildFilterRemovalHref = (key: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    next.delete("page");
    const query = next.toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  const currentPage = products.pagination.page;
  const totalPages = products.pagination.pages;
  const totalProducts = products.pagination.total;
  const startResult = totalProducts ? (currentPage - 1) * products.pagination.limit + 1 : 0;
  const endResult = totalProducts ? startResult + products.items.length - 1 : 0;
  const heroSummary = searchParams.search
    ? `Search results for "${searchParams.search}" across verified spare parts.`
    : activeFilters.length
      ? "Filtered catalog tuned to your selected brand, model, and part type."
      : "Browse our full spare-parts inventory with compatibility-aware product discovery.";
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) =>
    page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Products"
          title="Filtered spare parts catalog"
          description="Query-param driven listing for SSR-friendly catalog results across brand, model, and part type."
        />
        <div className="mt-6 grid gap-4 rounded-[32px] border border-slate-200/80 bg-panel p-5 shadow-card lg:grid-cols-[1.6fr_0.9fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Search context</p>
            <p className="mt-3 text-base text-slate">{heroSummary}</p>
          </div>
          <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Results shown</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {startResult}-{endResult}
            </p>
            <p className="mt-1 text-sm text-slate">of {totalProducts} matching part(s)</p>
          </div>
          <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Current page</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {products.pagination.page}/{products.pagination.pages}
            </p>
            <p className="mt-1 text-sm text-slate">
              {activeFilters.length ? `${activeFilters.length} active filter(s)` : "All products visible"}
            </p>
          </div>
        </div>
        <div className="mt-10">
          <CatalogFilters brands={brands} models={models} categories={categories} />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.length ? (
              activeFilters.map((filter) => (
                <Link
                  key={`${filter.key}-${filter.label}`}
                  href={buildFilterRemovalHref(filter.key)}
                  className="rounded-full bg-accentSoft px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#cfeee6]"
                >
                  {filter.label} ×
                </Link>
              ))
            ) : (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-slate shadow-card">
                All catalog items
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-slate">
              Showing {startResult}-{endResult} of {products.pagination.total} result(s)
            </p>
            <CatalogSort value={searchParams.sort} />
          </div>
        </div>
        <div className="mt-10">
          {products.items.length ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 ? (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={buildPageHref(Math.max(currentPage - 1, 1))}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      currentPage === 1
                        ? "pointer-events-none border border-slate-200 text-slate-300"
                        : "border border-slate-200 text-ink hover:bg-accentSoft"
                    }`}
                  >
                    Previous
                  </Link>
                  {pageNumbers.map((page, index) => {
                    const previousPage = pageNumbers[index - 1];
                    const showGap = previousPage && page - previousPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-3">
                        {showGap ? <span className="text-slate">…</span> : null}
                        <Link
                          href={buildPageHref(page)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            page === currentPage
                              ? "bg-accent text-white"
                              : "border border-slate-200 text-ink hover:bg-accentSoft"
                          }`}
                        >
                          {page}
                        </Link>
                      </div>
                    );
                  })}
                  <Link
                    href={buildPageHref(Math.min(currentPage + 1, totalPages))}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      currentPage === totalPages
                        ? "pointer-events-none border border-slate-200 text-slate-300"
                        : "border border-slate-200 text-ink hover:bg-accentSoft"
                    }`}
                  >
                    Next
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState title="No products found" description="Try changing the selected brand, model, or part type filters." />
          )}
        </div>
      </div>
    </PageShell>
  );
}
