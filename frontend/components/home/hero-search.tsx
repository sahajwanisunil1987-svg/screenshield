"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Wrench } from "lucide-react";
import { Brand, Category, MobileModel } from "@/types";
import { Button } from "../ui/button";
import { SearchCombobox } from "../ui/search-combobox";

type HeroSearchProps = {
  brands: Brand[];
  models: MobileModel[];
  categories: Category[];
};

const preferredCategoryOrder = ["battery", "lcd-display", "touch-screen", "charging-port", "camera", "back-panel", "speaker", "microphone"] as const;

export function HeroSearch({ brands, models, categories }: HeroSearchProps) {
  const router = useRouter();
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  const filteredModels = useMemo(() => {
    if (!brandSlug) return [];
    const brand = brands.find((item) => item.slug === brandSlug);
    return models.filter((item) => item.brandId === brand?.id);
  }, [brandSlug, brands, models]);

  const selectedBrand = brands.find((item) => item.slug === brandSlug);

  const featuredCategories = useMemo(() => {
    const ordered = [...categories].sort((left, right) => {
      const leftOrder = preferredCategoryOrder.indexOf(left.slug as (typeof preferredCategoryOrder)[number]);
      const rightOrder = preferredCategoryOrder.indexOf(right.slug as (typeof preferredCategoryOrder)[number]);
      return (leftOrder === -1 ? 999 : leftOrder) - (rightOrder === -1 ? 999 : rightOrder);
    });

    return ordered.slice(0, 6);
  }, [categories]);


  useEffect(() => {
    setModelSlug("");
  }, [brandSlug]);

  const onSearch = () => {
    if (!brandSlug || !modelSlug) {
      return;
    }

    const params = new URLSearchParams();
    params.set("brand", brandSlug);
    params.set("model", modelSlug);
    if (categorySlug) params.set("category", categorySlug);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/8 p-4 backdrop-blur md:p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200/90">
        <Wrench className="h-4 w-4" />
        Brand {">"} Model {">"} Part
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <SearchCombobox
          label="Brand"
          placeholder="Select brand"
          options={brands.map((brand) => ({
            label: brand.name,
            value: brand.slug,
            hint: brand.description ?? "Mobile brand"
          }))}
          value={brandSlug}
          onChange={setBrandSlug}
        />
        <SearchCombobox
          label="Model"
          placeholder={brandSlug ? "Select model" : "Choose brand first"}
          options={filteredModels.map((model) => ({
            label: model.name,
            value: model.slug,
            hint: selectedBrand?.name ?? model.brand?.name ?? "Compatible model"
          }))}
          value={modelSlug}
          onChange={setModelSlug}
          disabled={!brandSlug}
        />
        <SearchCombobox
          label="Part Type"
          placeholder={modelSlug ? "Select part type" : "Choose model first"}
          options={categories.map((category) => ({
            label: category.name,
            value: category.slug,
            hint: category.description ?? "Spare category"
          }))}
          value={categorySlug}
          onChange={setCategorySlug}
          disabled={!modelSlug}
        />
        <Button onClick={onSearch} disabled={!brandSlug || !modelSlug} className="gap-2 self-end">
          <Search className="h-4 w-4" />
          Find Parts
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {featuredCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setCategorySlug(category.slug)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              categorySlug === category.slug
                ? "border-teal-300 bg-teal-300/15 text-white"
                : "border-white/10 bg-white/5 text-white/78 hover:bg-white/10"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
