"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { value: "relevance", label: "Best match" },
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" }
] as const;

export function CatalogSort({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Sort</p>
      <select
        value={value ?? (searchParams.get("search") ? "relevance" : "newest")}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          const nextSort = event.target.value;

          if (nextSort === "newest" && !searchParams.get("search")) {
            params.delete("sort");
          } else if (nextSort === "relevance" && searchParams.get("search")) {
            params.delete("sort");
          } else {
            params.set("sort", nextSort);
          }

          params.delete("page");
          const query = params.toString();
          router.push(`${pathname}${query ? `?${query}` : ""}`);
        }}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm outline-none transition hover:border-accent/30 focus:border-accent"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
