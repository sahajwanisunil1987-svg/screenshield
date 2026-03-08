"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Brand, Category, MobileModel, SearchSuggestion } from "@/types";
import { Button } from "../ui/button";
import { SearchCombobox } from "../ui/search-combobox";
import { SearchAutocomplete } from "../ui/search-autocomplete";

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
          <SearchAutocomplete
            label="Keyword"
            value={keyword}
            onChange={setKeyword}
            onSubmit={() => onSearch()}
            onSuggestionSelect={(suggestion: SearchSuggestion) => router.push(`/products/${suggestion.slug}`)}
            placeholder="Battery, display, charging port..."
            brand={brandSlug}
            model={modelSlug}
            category={categorySlug}
            labelClassName="text-white/60"
            inputClassName="border-white/10 bg-white/95"
          />
        </div>
        <Button onClick={onSearch} className="gap-2">
          <Search className="h-4 w-4" />
          Find Parts
        </Button>
      </div>
    </div>
  );
}
