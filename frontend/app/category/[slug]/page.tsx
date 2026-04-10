import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductsResults } from "@/components/catalog/products-results";
import { PageShell } from "@/components/layout/page-shell";
import { CatalogFiltersForm } from "@/components/products/catalog-filters-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildCatalogHref } from "@/lib/catalog-url";
import { buildMetadata } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { Brand, Category, MobileModel, ProductListResponse } from "@/types";

export const revalidate = 300;

type CategorySearchParams = {
  brand?: string;
  model?: string;
  search?: string;
  page?: string;
  sort?: string;
};

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
};

const getCategories = cache(() => fetchApi<Category[]>("/categories", { next: { revalidate: 1800 } }));
const getBrands = cache(() => fetchApi<Brand[]>("/brands", { next: { revalidate: 1800 } }));
const getModels = cache(() => fetchApi<MobileModel[]>("/models", { next: { revalidate: 1800 } }));

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams, categories] = await Promise.all([params, searchParams, getCategories()]);
  const category = categories.find((entry) => entry.slug === slug);

  if (!category) {
    return buildMetadata({
      title: "Category Not Found",
      description: "The requested spare-parts category could not be found."
    });
  }

  const segments = [category.name, resolvedSearchParams.brand, resolvedSearchParams.model, resolvedSearchParams.search].filter(Boolean);
  const titleBase = `${category.name} Spare Parts`;
  const title = resolvedSearchParams.page ? `${titleBase} Page ${resolvedSearchParams.page}` : titleBase;
  const description = segments.length > 1
    ? `Browse ${category.name.toLowerCase()} spare parts on PurjiX with ${segments.slice(1).join(", ")} filters applied for cleaner repair-part discovery.`
    : category.description?.trim().length
      ? `${category.description} Browse compatible ${category.name.toLowerCase()} spare parts on PurjiX.`
      : `Browse compatible ${category.name.toLowerCase()} spare parts on PurjiX with SEO-friendly category URLs.`;

  return buildMetadata({
    title,
    description,
    path: buildCatalogHref({
      categorySlug: slug,
      brand: resolvedSearchParams.brand,
      model: resolvedSearchParams.model,
      search: resolvedSearchParams.search,
      sort: resolvedSearchParams.sort,
      page: resolvedSearchParams.page
    })
  });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, resolvedSearchParams, categories] = await Promise.all([params, searchParams, getCategories()]);
  const category = categories.find((entry) => entry.slug === slug);

  if (!category) {
    notFound();
  }

  const apiParams = new URLSearchParams();
  apiParams.set("category", slug);
  if (resolvedSearchParams.brand) apiParams.set("brand", resolvedSearchParams.brand);
  if (resolvedSearchParams.model) apiParams.set("model", resolvedSearchParams.model);
  if (resolvedSearchParams.search) apiParams.set("search", resolvedSearchParams.search);
  if (resolvedSearchParams.sort) apiParams.set("sort", resolvedSearchParams.sort);
  if (resolvedSearchParams.page) apiParams.set("page", resolvedSearchParams.page);

  const [products, brands, models] = await Promise.all([
    fetchApi<ProductListResponse>(`/products?${apiParams.toString()}`, { next: { revalidate: 300 } }),
    getBrands(),
    getModels()
  ]);

  const activeFilters = [
    { key: "category", label: category.name },
    resolvedSearchParams.brand ? { key: "brand", label: resolvedSearchParams.brand } : null,
    resolvedSearchParams.model ? { key: "model", label: resolvedSearchParams.model } : null,
    resolvedSearchParams.search ? { key: "search", label: resolvedSearchParams.search } : null
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const buildPageHref = (nextPage: number) =>
    buildCatalogHref({
      categorySlug: slug,
      brand: resolvedSearchParams.brand,
      model: resolvedSearchParams.model,
      search: resolvedSearchParams.search,
      sort: resolvedSearchParams.sort,
      page: nextPage > 1 ? String(nextPage) : undefined
    });

  const buildFilterRemovalHref = (key: string) =>
    buildCatalogHref({
      categorySlug: key === "category" ? undefined : slug,
      brand: key === "brand" ? undefined : resolvedSearchParams.brand,
      model: key === "model" ? undefined : resolvedSearchParams.model,
      search: key === "search" ? undefined : resolvedSearchParams.search,
      sort: resolvedSearchParams.sort
    });

  const currentPage = products.pagination.page;
  const totalProducts = products.pagination.total;
  const startResult = totalProducts ? (currentPage - 1) * products.pagination.limit + 1 : 0;
  const endResult = totalProducts ? startResult + products.items.length - 1 : 0;
  const heroSummary = resolvedSearchParams.search
    ? `Search results inside ${category.name.toLowerCase()} for "${resolvedSearchParams.search}".`
    : resolvedSearchParams.brand || resolvedSearchParams.model
      ? `Filtered ${category.name.toLowerCase()} catalog tuned to your selected brand and model.`
      : category.description?.trim().length
        ? category.description
        : `SEO-friendly category landing page for ${category.name.toLowerCase()} spare parts.`;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Category"
          title={`${category.name} Spare Parts`}
          description="Category landing page with crawlable URLs, server-rendered results, and compatibility-aware filters."
        />
        <div className="theme-surface mt-6 grid gap-4 rounded-[32px] border border-slate-200/80 p-5 lg:grid-cols-[1.6fr_0.9fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Category context</p>
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
            selectedCategory={slug}
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
