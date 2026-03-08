"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SearchSuggestion } from "@/types";

type SearchAutocompleteProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder: string;
  brand?: string;
  model?: string;
  category?: string;
  inputClassName?: string;
  labelClassName?: string;
  dropdownClassName?: string;
};

export function SearchAutocomplete({
  label,
  value,
  onChange,
  onSubmit,
  onSuggestionSelect,
  placeholder,
  brand,
  model,
  category,
  inputClassName,
  labelClassName,
  dropdownClassName
}: SearchAutocompleteProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      setLoading(true);
      api
        .get("/products/suggestions", {
          params: {
            q: query,
            brand: brand || undefined,
            model: model || undefined,
            category: category || undefined
          }
        })
        .then((response) => {
          setSuggestions(response.data);
          setOpen(true);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [brand, category, model, value]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    onSubmit(value.trim());
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (
        <label className={cn("mb-2 block text-xs font-semibold uppercase tracking-[0.22em]", labelClassName)}>
          {label}
        </label>
      ) : null}
      <form onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
        <input
          value={value}
          onFocus={() => setOpen(Boolean(suggestions.length))}
          onChange={(event) => {
            onChange(event.target.value);
            if (!event.target.value.trim()) {
              setSuggestions([]);
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10",
            inputClassName
          )}
        />
      </form>
      {open ? (
        <div className={cn("absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-card", dropdownClassName)}>
          {loading ? <div className="px-3 py-4 text-sm text-slate">Loading suggestions...</div> : null}
          {!loading && suggestions.length
            ? suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    onChange(suggestion.searchTerm);
                    onSuggestionSelect?.(suggestion);
                    setOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-accentSoft"
                >
                  <p className="text-sm font-semibold text-ink">{suggestion.label}</p>
                  <p className="mt-1 text-xs text-slate">{suggestion.hint}</p>
                </button>
              ))
            : null}
          {!loading && !suggestions.length ? (
            <button
              type="button"
              onClick={() => submit()}
              className="block w-full rounded-xl px-3 py-4 text-left text-sm text-slate transition hover:bg-accentSoft"
            >
              Search for "{value.trim()}"
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
