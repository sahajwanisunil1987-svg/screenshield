"use client";

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Clock3, Search, TrendingUp, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SearchSuggestion } from "@/types";

const RECENT_SEARCHES_KEY = "sparekart-recent-searches";
const MAX_RECENT_SEARCHES = 5;
const TRENDING_SEARCHES = ["Vivo Y21 Display", "iPhone 13 Battery", "Samsung Charging Port", "OnePlus Back Panel"];

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
  name?: string;
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
  dropdownClassName,
  name
}: SearchAutocompleteProps) {
  const inputId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((entry) => typeof entry === "string"));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearch = (nextValue: string) => {
    const normalized = nextValue.trim();
    if (!normalized) {
      return;
    }

    setRecentSearches((current) => {
      const next = [normalized, ...current.filter((entry) => entry.toLowerCase() !== normalized.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

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
      setLoading(false);
      setActiveIndex(-1);
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
          setActiveIndex(response.data.length ? 0 : -1);
        })
        .catch(() => {
          setSuggestions([]);
          setActiveIndex(-1);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [brand, category, model, value]);

  const submit = () => {
    const query = value.trim();
    if (!query) {
      return;
    }

    saveRecentSearch(query);
    onSubmit(query);
    setOpen(false);
  };

  const quickSuggestions = useMemo(
    () =>
      value.trim()
        ? []
        : [
            ...recentSearches.map((entry) => ({ kind: "recent" as const, label: entry })),
            ...TRENDING_SEARCHES.map((entry) => ({
              kind: "trending" as const,
              label: entry
            }))
          ].filter((entry, index, collection) => collection.findIndex((item) => item.label === entry.label) === index),
    [recentSearches, value]
  );

  const suggestionActions = useMemo(
    () =>
      suggestions.map((suggestion) => ({
        key: suggestion.id,
        run: () => {
          onChange(suggestion.searchTerm);
          saveRecentSearch(suggestion.searchTerm);
          onSuggestionSelect?.(suggestion);
          setOpen(false);
        }
      })),
    [onChange, onSuggestionSelect, suggestions]
  );

  const quickActions = useMemo(
    () =>
      quickSuggestions.map((entry) => ({
        key: `${entry.kind}-${entry.label}`,
        run: () => {
          onChange(entry.label);
          saveRecentSearch(entry.label);
          onSubmit(entry.label);
          setOpen(false);
        }
      })),
    [onChange, onSubmit, quickSuggestions]
  );

  const actions = value.trim() ? suggestionActions : quickActions;

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (
        <label htmlFor={inputId} className={cn("mb-2 block text-xs font-semibold uppercase tracking-[0.22em]", labelClassName)}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
        <input
          id={inputId}
          name={name ?? "search"}
          aria-label={label ?? placeholder}
          value={value}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!actions.length) return;
              setOpen(true);
              setActiveIndex((current) => (current + 1 >= actions.length ? 0 : current + 1));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!actions.length) return;
              setOpen(true);
              setActiveIndex((current) => (current <= 0 ? actions.length - 1 : current - 1));
              return;
            }

            if (event.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (open && activeIndex >= 0 && actions[activeIndex]) {
                actions[activeIndex].run();
                return;
              }
              submit();
            }
          }}
          onFocus={() => {
            setOpen(Boolean(suggestions.length || quickSuggestions.length));
            setActiveIndex(value.trim() ? (suggestions.length ? 0 : -1) : quickSuggestions.length ? 0 : -1);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            if (!event.target.value.trim()) {
              setSuggestions([]);
              setOpen(true);
              setActiveIndex(quickSuggestions.length ? 0 : -1);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 pr-11 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10",
            inputClassName
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSuggestions([]);
              setOpen(true);
              setActiveIndex(quickSuggestions.length ? 0 : -1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate transition hover:bg-slate-100 hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {open ? (
        <div className={cn("absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-card", dropdownClassName)}>
          {!value.trim() && quickSuggestions.length ? (
            <div className="space-y-1">
              {recentSearches.length ? (
                <>
                  <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Recent searches</p>
                  {recentSearches.map((entry) => (
                    <button
                      key={`recent-${entry}`}
                      type="button"
                      onClick={() => {
                        onChange(entry);
                        saveRecentSearch(entry);
                        onSubmit(entry);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-accentSoft",
                        activeIndex === quickActions.findIndex((item) => item.key === `recent-${entry}`) && "bg-accentSoft"
                      )}
                    >
                      <Clock3 className="h-4 w-4 text-slate" />
                      <span className="text-sm font-medium text-ink">{entry}</span>
                    </button>
                  ))}
                </>
              ) : null}
              <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Trending</p>
              {TRENDING_SEARCHES.filter((entry) => !recentSearches.includes(entry)).map((entry) => (
                <button
                  key={`trending-${entry}`}
                  type="button"
                  onClick={() => {
                    onChange(entry);
                    saveRecentSearch(entry);
                    onSubmit(entry);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-accentSoft",
                    activeIndex === quickActions.findIndex((item) => item.key === `trending-${entry}`) && "bg-accentSoft"
                  )}
                >
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-ink">{entry}</span>
                </button>
              ))}
            </div>
          ) : null}
          {loading ? <div className="px-3 py-4 text-sm text-slate">Loading suggestions...</div> : null}
          {!loading && value.trim() && suggestions.length
            ? suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    onChange(suggestion.searchTerm);
                    saveRecentSearch(suggestion.searchTerm);
                    onSuggestionSelect?.(suggestion);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded-xl px-3 py-3 text-left transition hover:bg-accentSoft",
                    activeIndex === suggestionActions.findIndex((item) => item.key === suggestion.id) && "bg-accentSoft"
                  )}
                >
                  <p className="text-sm font-semibold text-ink">{suggestion.label}</p>
                  <p className="mt-1 text-xs text-slate">{suggestion.hint}</p>
                </button>
              ))
            : null}
          {!loading && value.trim() && !suggestions.length ? (
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
