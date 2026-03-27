"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type ResourceField = {
  key: string;
  placeholder: string;
  type?: "text" | "select" | "checkbox";
  options?: Array<{ label: string; value: string }>;
};

type ResourceItem = {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
};

type ResourceManagerProps = {
  title: string;
  getUrl: string;
  createUrl: string;
  updateBaseUrl: string;
  deleteBaseUrl: string;
  fields: ResourceField[];
  subtitlePath?: string;
  subtitlePrefix?: string;
};

const createEmptyForm = (fields: ResourceField[]) =>
  fields.reduce<Record<string, string | boolean>>((acc, field) => {
    acc[field.key] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});

export function ResourceManager({
  title,
  getUrl,
  createUrl,
  updateBaseUrl,
  deleteBaseUrl,
  fields,
  subtitlePath,
  subtitlePrefix
}: ResourceManagerProps) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [form, setForm] = useState<Record<string, string | boolean>>(createEmptyForm(fields));
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(getUrl, authHeaders(token));
      setItems(response.data.items ?? response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to load ${title.toLowerCase()}`));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm(createEmptyForm(fields));
    setIsActive(true);
    setEditingId(null);
  };

  useEffect(() => {
    if (!hasHydrated || !token) {
      return;
    }

    load();
  }, [getUrl, hasHydrated, token]);

  const getSubtitle = (item: ResourceItem) => {
    if (!subtitlePath) {
      return undefined;
    }

    const value = subtitlePath.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, item);

    if (typeof value !== "string" || !value.trim()) {
      return undefined;
    }

    return subtitlePrefix ? `${subtitlePrefix}${value}` : value;
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      const name = String(item.name ?? item.code ?? "").toLowerCase();
      const subtitle = String(getSubtitle(item) ?? "").toLowerCase();
      return name.includes(normalizedQuery) || subtitle.includes(normalizedQuery);
    });
  }, [items, query]);

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-white/60">
            {editingId ? `Editing ${title.slice(0, -1).toLowerCase()}` : `Create and manage ${title.toLowerCase()}`}
          </p>
        </div>
        {editingId ? (
          <Button variant="ghost" onClick={resetForm}>
            Cancel edit
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.5fr_auto]">
        <Input
          placeholder={`Search ${title.toLowerCase()} by name${subtitlePath ? " or mapped detail" : ""}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="bg-white/95"
        />
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
          {filteredItems.length} of {items.length} visible
        </div>
      </div>
      <div className={`grid gap-4 ${fields.length > 2 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        {fields.map((field) => (
          field.type === "select" ? (
            <select
              key={field.key}
              value={String(form[field.key] ?? "")}
              onChange={(event) => setForm((state) => ({ ...state, [field.key]: event.target.value }))}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <label key={field.key} className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                checked={Boolean(form[field.key])}
                onChange={(event) => setForm((state) => ({ ...state, [field.key]: event.target.checked }))}
              />
              {field.placeholder}
            </label>
          ) : (
            <Input
              key={field.key}
              placeholder={field.placeholder}
              value={String(form[field.key] ?? "")}
              onChange={(event) => setForm((state) => ({ ...state, [field.key]: event.target.value }))}
            />
          )
        ))}
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Active
        </label>
      </div>
      <Button
        onClick={async () => {
          try {
            if (editingId) {
              await api.put(`${updateBaseUrl}/${editingId}`, { ...form, isActive }, authHeaders(token));
              toast.success(`${title.slice(0, -1)} updated`);
            } else {
              await api.post(createUrl, { ...form, isActive }, authHeaders(token));
              toast.success(`${title.slice(0, -1)} created`);
            }

            resetForm();
            load();
          } catch (error) {
            toast.error(
              getApiErrorMessage(error, `Unable to ${editingId ? "update" : "create"} ${title.toLowerCase()}`)
            );
          }
        }}
      >
        {editingId ? "Save changes" : "Add"}
      </Button>
      <div className="space-y-3 text-sm">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-[24px] bg-white/5" />
            ))
          : filteredItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{item.name ?? item.code}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        item.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {getSubtitle(item) ? <p className="text-white/60">{getSubtitle(item)}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-cyan-300"
                    onClick={() => {
                      const nextForm = fields.reduce<Record<string, string | boolean>>((acc, field) => {
                        acc[field.key] = field.type === "checkbox" ? Boolean(item[field.key]) : String(item[field.key] ?? "");
                        return acc;
                      }, {});

                      setForm(nextForm);
                      setIsActive(Boolean(item.isActive));
                      setEditingId(item.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400"
                    onClick={async () => {
                      try {
                        await api.delete(`${deleteBaseUrl}/${item.id}`, authHeaders(token));
                        toast.success("Deleted");
                        if (editingId === item.id) {
                          resetForm();
                        }
                        load();
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete item"));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        {!isLoading && !filteredItems.length ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
            No {title.toLowerCase()} match the current search.
          </div>
        ) : null}
      </div>
    </div>
  );
}
