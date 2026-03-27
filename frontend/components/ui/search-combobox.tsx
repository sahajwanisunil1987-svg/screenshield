"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchComboboxOption = {
  label: string;
  value: string;
  hint?: string;
};

type SearchComboboxProps = {
  label: string;
  placeholder: string;
  options: SearchComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
};

export function SearchCombobox({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  name
}: SearchComboboxProps) {
  const inputId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected?.label]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? "");
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [selected?.label]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options.slice(0, 8);
    }

    return options
      .filter((option) => {
        const haystack = `${option.label} ${option.hint ?? ""}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  }, [options, query]);

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={inputId} className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
        <input
          id={inputId}
          name={name ?? label.toLowerCase().replace(/\s+/g, "-")}
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value.trim()) {
              onChange("");
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-2xl border border-white/10 bg-white/95 px-11 py-4 text-sm text-ink outline-none transition",
            disabled && "cursor-not-allowed bg-slate-100 text-slate"
          )}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
      </div>
      {open && !disabled ? (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery(option.label);
                  setOpen(false);
                }}
                className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition hover:bg-accentSoft"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{option.label}</p>
                  {option.hint ? <p className="mt-1 text-xs text-slate">{option.hint}</p> : null}
                </div>
                {value === option.value ? <Check className="mt-0.5 h-4 w-4 text-accent" /> : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-slate">No matches found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
