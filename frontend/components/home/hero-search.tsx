"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Brand, Category, MobileModel } from "@/types";
import { Button } from "../ui/button";

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
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="rounded-[36px] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-7">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          value={brandSlug}
          onChange={(event) => setBrandSlug(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-sm text-ink outline-none"
        >
          <option value="">Select brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
        <select
          value={modelSlug}
          onChange={(event) => setModelSlug(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-sm text-ink outline-none"
        >
          <option value="">Select model</option>
          {filteredModels.map((model) => (
            <option key={model.id} value={model.slug}>
              {model.name}
            </option>
          ))}
        </select>
        <select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-sm text-ink outline-none"
        >
          <option value="">Select part type</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <Button onClick={onSearch} className="gap-2">
          <Search className="h-4 w-4" />
          Find Parts
        </Button>
      </div>
    </div>
  );
}
