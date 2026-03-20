import Link from "next/link";
import { Brand, Category, MobileModel } from "@/types";

type CatalogFiltersFormProps = {
  brands: Brand[];
  models: MobileModel[];
  categories: Category[];
  selectedBrand?: string;
  selectedModel?: string;
  selectedCategory?: string;
  search?: string;
  sort?: string;
};

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "relevance", label: "Best match" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" }
] as const;

export function CatalogFiltersForm({
  brands,
  models,
  categories,
  selectedBrand,
  selectedModel,
  selectedCategory,
  search,
  sort
}: CatalogFiltersFormProps) {
  const filteredModels = selectedBrand
    ? models.filter((model) => model.brand?.slug === selectedBrand)
    : models;
  const activeCount = [selectedBrand, selectedModel, selectedCategory, search].filter(Boolean).length;
  const defaultSort = search ? "relevance" : "newest";

  return (
    <form action="/products" className="rounded-[32px] border border-slate-200/80 bg-panel p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Catalog filters</p>
          <p className="mt-2 text-sm text-slate">
            {activeCount
              ? `${activeCount} active filter${activeCount > 1 ? "s" : ""}. Refine brand, model, part type, keyword, and sort.`
              : "Use lightweight server-side filters to refine brand, model, part type, and keyword."}
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-accentSoft"
        >
          Clear all
        </Link>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate">Brand</span>
          <select
            name="brand"
            defaultValue={selectedBrand ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate">Model</span>
          <select
            name="model"
            defaultValue={selectedModel ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
          >
            <option value="">All models</option>
            {filteredModels.map((model) => (
              <option key={model.id} value={model.slug}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate">Part type</span>
          <select
            name="category"
            defaultValue={selectedCategory ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
          >
            <option value="">All parts</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate">Keyword</span>
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Display, battery, SKU..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate">Sort</span>
          <select
            name="sort"
            defaultValue={sort ?? defaultSort}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Apply filters
          </button>
        </div>
      </div>
    </form>
  );
}
