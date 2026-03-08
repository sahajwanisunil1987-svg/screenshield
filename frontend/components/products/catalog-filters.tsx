"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Brand, Category, MobileModel, SearchSuggestion } from "@/types";
import { SearchCombobox } from "../ui/search-combobox";
import { Button } from "../ui/button";
import { SearchAutocomplete } from "../ui/search-autocomplete";

type CatalogFiltersProps = {
  brands: Brand[];
  models: MobileModel[];
  categories: Category[];
};

export function CatalogFilters({ brands, models, categories }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const brand = searchParams.get("brand") ?? "";
  const model = searchParams.get("model") ?? "";
  const category = searchParams.get("category") ?? "";

  const modelOptions = useMemo(() => {
    if (!brand) {
      return models;
    }

    const selectedBrand = brands.find((item) => item.slug === brand);
    return models.filter((item) => item.brandId === selectedBrand?.id);
  }, [brand, brands, models]);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "brand") {
      params.delete("model");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const applySearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    router.push(pathname);
  };

  return (
    <div className="rounded-[32px] border border-slate-200/80 bg-panel p-5 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto_auto]">
        <SearchCombobox
          label="Brand"
          placeholder="Search brand"
          options={brands.map((item) => ({
            label: item.name,
            value: item.slug,
            hint: item.description ?? "Mobile brand"
          }))}
          value={brand}
          onChange={(value) => setParam("brand", value)}
        />
        <SearchCombobox
          label="Model"
          placeholder={brand ? "Search model" : "Select brand first"}
          options={modelOptions.map((item) => ({
            label: item.name,
            value: item.slug,
            hint: item.brand?.name ?? "Compatible model"
          }))}
          value={model}
          onChange={(value) => setParam("model", value)}
          disabled={!brand && !modelOptions.length}
        />
        <SearchCombobox
          label="Part Type"
          placeholder="Search category"
          options={categories.map((item) => ({
            label: item.name,
            value: item.slug,
            hint: item.description ?? "Spare category"
          }))}
          value={category}
          onChange={(value) => setParam("category", value)}
        />
        <div>
          <SearchAutocomplete
            label="Keyword"
            value={search}
            onChange={setSearch}
            onSubmit={applySearch}
            onSuggestionSelect={(suggestion: SearchSuggestion) => router.push(`/products/${suggestion.slug}`)}
            placeholder="Display, battery, SKU..."
            brand={brand}
            model={model}
            category={category}
            labelClassName="text-slate"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={applySearch} className="w-full">Apply</Button>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accentSoft"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
