"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function AdminInventoryPage() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "HEALTHY">("ALL");

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/inventory", authHeaders(token))
      .then((response) => setItems(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load inventory"));
      });
  }, [token]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.product.name.toLowerCase().includes(normalizedQuery) ||
        item.product.sku.toLowerCase().includes(normalizedQuery) ||
        item.product.brand.name.toLowerCase().includes(normalizedQuery) ||
        item.product.model.name.toLowerCase().includes(normalizedQuery) ||
        item.product.category.name.toLowerCase().includes(normalizedQuery) ||
        (item.warehouseCode ?? "").toLowerCase().includes(normalizedQuery);

      const isLowStock = item.stock <= item.lowStockLimit;
      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW" ? isLowStock : !isLowStock);

      return matchesQuery && matchesStock;
    });
  }, [items, query, stockFilter]);

  return (
    <AdminGuard>
      <AdminShell title="Inventory">
        <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Inventory controls</p>
            <p className="text-sm text-white/60">
              {filteredItems.length} of {items.length} inventory records visible
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
          {filteredItems.map((item) => (
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
          {!filteredItems.length ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
              No inventory records match the current search and filters.
            </div>
          ) : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
