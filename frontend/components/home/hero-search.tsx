"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Brand, Category, MobileModel } from "@/types";
import { Button } from "../ui/button";
import { SearchCombobox } from "../ui/search-combobox";
import { Input } from "../ui/input";

type HeroSearchProps = {
  brands: Brand[];
  models: MobileModel[];
  categories: Category[];
};

export function HeroSearch({ brands, models, categories }: HeroSearchProps) {
  const router = useRouter();
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [keyword, setKeyword] = useState("");

  const filteredModels = useMemo(() => {
    if (!brandSlug) return models;
    const brand = brands.find((item) => item.slug === brandSlug);
    return models.filter((item) => item.brandId === brand?.id);
  }, [brandSlug, brands, models]);

  useEffect(() => {
    setModelSlug("");
  }, [brandSlug]);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (brandSlug) params.set("brand", brandSlug);
    if (modelSlug) params.set("model", modelSlug);
    if (categorySlug) params.set("category", categorySlug);
    if (keyword.trim()) params.set("search", keyword.trim());
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="rounded-[36px] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-7">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
        <SearchCombobox
          label="Brand"
          placeholder="Search brand"
          options={brands.map((brand) => ({
            label: brand.name,
            value: brand.slug,
            hint: brand.description ?? "Trusted mobile brand"
          }))}
          value={brandSlug}
          onChange={setBrandSlug}
        />
        <SearchCombobox
          label="Model"
          placeholder={brandSlug ? "Search model" : "Choose brand first"}
          options={filteredModels.map((model) => ({
            label: model.name,
            value: model.slug,
            hint: model.brand?.name ?? "Compatible model"
          }))}
          value={modelSlug}
          onChange={setModelSlug}
          disabled={!brandSlug && !filteredModels.length}
        />
        <SearchCombobox
          label="Part Type"
          placeholder="Search spare category"
          options={categories.map((category) => ({
            label: category.name,
            value: category.slug,
            hint: category.description ?? "Part category"
          }))}
          value={categorySlug}
          onChange={setCategorySlug}
        />
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Keyword</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Battery, display, charging port..."
              className="border-white/10 bg-white/95 pl-11"
            />
          </div>
        </div>
        <Button onClick={onSearch} className="gap-2">
          <Search className="h-4 w-4" />
          Find Parts
        </Button>
      </div>
    </div>
  );
}
