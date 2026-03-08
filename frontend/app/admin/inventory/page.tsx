"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { InventoryItem, PaginatedResponse } from "@/types";

export default function AdminInventoryPage() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "HEALTHY">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const config = authHeaders(token);
    api
      .get<PaginatedResponse<InventoryItem>>("/admin/inventory", {
        ...config,
        params: {
          search: query || undefined,
          stock: stockFilter,
          page,
          limit: 12
        }
      })
      .then((response) => {
        setItems(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load inventory"));
      });
  }, [page, query, stockFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [query, stockFilter]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );

  return (
    <AdminGuard>
      <AdminShell title="Inventory">
        <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Inventory controls</p>
            <p className="text-sm text-white/60">
              {pagination.total} inventory records found · page {pagination.page} of {pagination.pages}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_minmax(0,220px)]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by part, SKU, brand, model, category, or warehouse"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
            />
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value as "ALL" | "LOW" | "HEALTHY")}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All stock states</option>
              <option value="LOW">Low stock only</option>
              <option value="HEALTHY">Healthy stock only</option>
            </select>
          </div>
        </div>
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {items.map((item) => (
            <div key={item.id} className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm lg:grid-cols-[1.2fr_1fr_auto]">
              <div className="space-y-2">
                <p className="font-semibold text-white">{item.product.name}</p>
                <p className="text-white/60">
                  {item.product.brand.name} · {item.product.model.name} · {item.product.category.name}
                </p>
                <p className="text-white/40">
                  SKU {item.product.sku} · Price {formatCurrency(Number(item.product.price))}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  value={item.stock}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) => (entry.id === item.id ? { ...entry, stock: Number(event.target.value) } : entry))
                    )
                  }
                  className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                />
                <input
                  type="number"
                  value={item.lowStockLimit}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, lowStockLimit: Number(event.target.value) } : entry
                      )
                    )
                  }
                  className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                />
                <input
                  value={item.warehouseCode ?? ""}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, warehouseCode: event.target.value } : entry
                      )
                    )
                  }
                  placeholder="Warehouse"
                  className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
              <div className="flex flex-col items-start gap-3 lg:items-end">
                <span className={item.stock <= item.lowStockLimit ? "text-amber-300" : "text-emerald-300"}>
                  {item.stock <= item.lowStockLimit ? "Low stock" : "Healthy stock"}
                </span>
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                  onClick={async () => {
                    try {
                      const response = await api.patch(
                        `/admin/inventory/${item.id}`,
                        {
                          stock: item.stock,
                          lowStockLimit: item.lowStockLimit,
                          warehouseCode: item.warehouseCode || undefined
                        },
                        authHeaders(token)
                      );
                      setItems((current) => current.map((entry) => (entry.id === item.id ? response.data : entry)));
                      toast.success("Inventory updated");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Unable to update inventory"));
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ))}
          {!items.length ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
              No inventory records match the current search and filters.
            </div>
          ) : null}
          {pagination.pages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={pagination.page === 1}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10"
              >
                Previous
              </button>
              {pageNumbers.map((entry, index) => {
                const previousPage = pageNumbers[index - 1];
                const showGap = previousPage && entry - previousPage > 1;

                return (
                  <div key={entry} className="flex items-center gap-3">
                    {showGap ? <span className="text-white/40">…</span> : null}
                    <button
                      type="button"
                      onClick={() => setPage(entry)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        entry === pagination.page ? "bg-accent text-white" : "border border-white/10 text-white hover:bg-white/10"
                      }`}
                    >
                      {entry}
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, pagination.pages))}
                disabled={pagination.page === pagination.pages}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
