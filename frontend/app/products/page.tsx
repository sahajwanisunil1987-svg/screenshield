import type { Metadata } from "next";
import { ProductsResults } from "@/components/catalog/products-results";
import { PageShell } from "@/components/layout/page-shell";
import { CatalogFiltersForm } from "@/components/products/catalog-filters-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { Brand, Category, MobileModel, ProductListResponse } from "@/types";

export const revalidate = 300;

type ProductsSearchParams = {
  brand?: string;
  model?: string;
  category?: string;
  search?: string;
  page?: string;
  sort?: string;
};

type ProductsPageProps = {
  searchParams: Promise<ProductsSearchParams>;
};

export async function generateMetadata({
  searchParams
}: ProductsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const segments = [
    resolvedSearchParams.brand,
    resolvedSearchParams.model,
    resolvedSearchParams.category,
    resolvedSearchParams.search
  ].filter(Boolean);
  const titleBase = segments.length ? `${segments.join(" / ")} Parts` : "Mobile Spare Parts Catalog";
  const title = resolvedSearchParams.page ? `${titleBase} Page ${resolvedSearchParams.page}` : titleBase;
  const description = segments.length
    ? `Browse PurjiX results for ${segments.join(", ")} with SSR-friendly filters, compatible spare parts, and SKU-aware product discovery.`
    : "Browse the PurjiX mobile spare parts catalog with brand, model, category, and keyword filters.";

  return buildMetadata({ title, description });
}

export default async function ProductsPage({
  searchParams
}: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  if (resolvedSearchParams.brand) params.set("brand", resolvedSearchParams.brand);
  if (resolvedSearchParams.model) params.set("model", resolvedSearchParams.model);
  if (resolvedSearchParams.category) params.set("category", resolvedSearchParams.category);
  if (resolvedSearchParams.search) params.set("search", resolvedSearchParams.search);
  if (resolvedSearchParams.sort) params.set("sort", resolvedSearchParams.sort);
  if (resolvedSearchParams.page) params.set("page", resolvedSearchParams.page);

  const [products, brands, models, categories] = await Promise.all([
    fetchApi<ProductListResponse>(`/products?${params.toString()}`, { next: { revalidate: 300 } }),
    fetchApi<Brand[]>("/brands", { next: { revalidate: 1800 } }),
    fetchApi<MobileModel[]>("/models", { next: { revalidate: 1800 } }),
    fetchApi<Category[]>("/categories", { next: { revalidate: 1800 } })
  ]);

  const activeFilters = [
    resolvedSearchParams.brand ? { key: "brand", label: resolvedSearchParams.brand } : null,
    resolvedSearchParams.model ? { key: "model", label: resolvedSearchParams.model } : null,
    resolvedSearchParams.category ? { key: "category", label: resolvedSearchParams.category } : null,
    resolvedSearchParams.search ? { key: "search", label: resolvedSearchParams.search } : null
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
  const totalProducts = products.pagination.total;
  const startResult = totalProducts ? (currentPage - 1) * products.pagination.limit + 1 : 0;
  const endResult = totalProducts ? startResult + products.items.length - 1 : 0;
  const heroSummary = resolvedSearchParams.search
    ? `Search results for "${resolvedSearchParams.search}" across verified spare parts.`
    : activeFilters.length
      ? "Filtered catalog tuned to your selected brand, model, and part type."
      : "Browse our full spare-parts inventory with compatibility-aware product discovery.";
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Products"
          title="Filtered spare parts catalog"
          description="Query-param driven listing for SSR-friendly catalog results across brand, model, and part type."
        />
        <div className="theme-surface mt-6 grid gap-4 rounded-[32px] border border-slate-200/80 p-5 lg:grid-cols-[1.6fr_0.9fr_0.9fr]">
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
          <CatalogFiltersForm
            brands={brands}
            models={models}
            categories={categories}
            selectedBrand={resolvedSearchParams.brand}
            selectedModel={resolvedSearchParams.model}
            selectedCategory={resolvedSearchParams.category}
            search={resolvedSearchParams.search}
            sort={resolvedSearchParams.sort}
          />
        </div>
        <ProductsResults
          products={products}
          activeFilters={activeFilters}
          startResult={startResult}
          endResult={endResult}
          buildFilterRemovalHref={buildFilterRemovalHref}
          buildPageHref={buildPageHref}
        />
      </div>
    </PageShell>
  );
}
