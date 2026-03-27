"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [search, setSearch] = useState("");
  const [searchUiReady, setSearchUiReady] = useState(false);

  const enableSearchUi = () => setSearchUiReady(true);

  const onSearch = () => {
    if (!searchUiReady) {
      enableSearchUi();
      return;
    }

    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }

    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    onSubmitted?.();
  };

  return (
    <div className={wrapperClassName} role="search" onPointerEnter={enableSearchUi} onFocusCapture={enableSearchUi}>
      <div className="min-w-0 flex-1">
        {searchUiReady ? (
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
        ) : (
          <SearchAutocompleteFallback placeholder={placeholder} onActivate={enableSearchUi} />
        )}
      </div>
      <button type="button" onClick={onSearch} className={buttonClassName}>
        {buttonLabel}
      </button>
    </div>
  );
}

function SearchAutocompleteFallback({
  placeholder,
  onActivate
}: {
  placeholder: string;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="flex h-[50px] w-full items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-sm text-white/55 transition hover:border-white/20 hover:bg-white/10"
    >
      <SearchSuggestionIcon />
      <span className="ml-3 block truncate whitespace-nowrap">{placeholder}</span>
    </button>
  );
}

function SearchSuggestionIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
}
