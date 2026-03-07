"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Brand, Category, MobileModel } from "@/types";
import { SearchCombobox } from "../ui/search-combobox";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate">Keyword</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Display, battery, SKU..."
              className="pl-11"
            />
          </div>
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
