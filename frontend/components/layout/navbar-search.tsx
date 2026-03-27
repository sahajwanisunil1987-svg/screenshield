"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchSuggestion } from "@/types";

const SearchAutocomplete = dynamic(
  () => import("@/components/ui/search-autocomplete").then((module) => module.SearchAutocomplete),
  {
    ssr: false,
    loading: () => <div className="h-[50px] w-full rounded-2xl border border-white/10 bg-white/5" />
  }
);

type NavbarSearchProps = {
  placeholder: string;
  buttonLabel: string;
  wrapperClassName?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  buttonClassName?: string;
  onSubmitted?: () => void;
};

export function NavbarSearch({
  placeholder,
  buttonLabel,
  wrapperClassName = "flex items-center gap-3",
  inputClassName,
  dropdownClassName,
  buttonClassName,
  onSubmitted
}: NavbarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (pathname === "/products") {
      setSearch(searchParams.get("search") ?? "");
      return;
    }

    setSearch("");
  }, [pathname, searchParams]);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }

    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    onSubmitted?.();
  };

  return (
    <div className={wrapperClassName} role="search">
      <div className="min-w-0 flex-1">
        <SearchAutocomplete
          name="site-search"
          value={search}
          onChange={setSearch}
          onSubmit={() => onSearch()}
          onSuggestionSelect={(suggestion: SearchSuggestion) => {
            router.push(`/products/${suggestion.slug}`);
            onSubmitted?.();
          }}
          placeholder={placeholder}
          inputClassName={inputClassName}
          dropdownClassName={dropdownClassName}
        />
      </div>
      <button type="button" onClick={onSearch} className={buttonClassName}>
        {buttonLabel}
      </button>
    </div>
  );
}
