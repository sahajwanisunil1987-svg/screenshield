"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackagePlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { InventoryItem, InventorySummary } from "@/types";

type InventoryResponse = {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: InventorySummary;
};

const reorderSuggestion = (item: InventoryItem) => Math.max(item.lowStockLimit * 3, 12) - item.stock;

const healthState = (item: InventoryItem) => {
  if (item.stock <= Math.max(2, Math.floor(item.lowStockLimit / 2))) {
    return { label: "Critical", tone: "text-red-300", chip: "bg-red-500/15 text-red-200" };
  }

  if (item.stock <= item.lowStockLimit) {
    return { label: "Low", tone: "text-amber-300", chip: "bg-amber-500/15 text-amber-200" };
  }

  return { label: "Healthy", tone: "text-emerald-300", chip: "bg-emerald-500/15 text-emerald-200" };
};

export default function AdminInventoryPage() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({ critical: 0, low: 0, healthy: 0, totalUnits: 0, reorderUnits: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "CRITICAL" | "LOW" | "HEALTHY">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    api
      .get<InventoryResponse>("/admin/inventory", {
        ...authHeaders(token),
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
        setSummary(response.data.summary);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load inventory"));
      });
  }, [page, query, stockFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [query, stockFilter]);

  const pageNumbers = useMemo(() =>
    Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
      entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
    ), [pagination.page, pagination.pages]);

  return (
    <AdminGuard>
      <AdminShell title="Inventory">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 p-5 text-white">
            <div className="flex items-center justify-between"><p className="text-sm text-white/65">Critical items</p><AlertTriangle className="h-5 w-5 text-red-200" /></div>
            <p className="mt-3 font-display text-4xl text-red-100">{summary.critical}</p>
            <p className="mt-2 text-xs text-white/50">Immediate stock risk. Reorder today.</p>
          </div>
          <div className="rounded-[28px] border border-amber-400/20 bg-amber-500/10 p-5 text-white">
            <div className="flex items-center justify-between"><p className="text-sm text-white/65">Low stock items</p><PackagePlus className="h-5 w-5 text-amber-200" /></div>
            <p className="mt-3 font-display text-4xl text-amber-100">{summary.low}</p>
            <p className="mt-2 text-xs text-white/50">Includes critical SKUs below preferred threshold.</p>
          </div>
          <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-white">
            <div className="flex items-center justify-between"><p className="text-sm text-white/65">Healthy items</p><ShieldCheck className="h-5 w-5 text-emerald-200" /></div>
            <p className="mt-3 font-display text-4xl text-emerald-100">{summary.healthy}</p>
            <p className="mt-2 text-xs text-white/50">SKUs carrying enough stock for current threshold.</p>
          </div>
          <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 p-5 text-white">
            <div className="flex items-center justify-between"><p className="text-sm text-white/65">Suggested reorder units</p><PackagePlus className="h-5 w-5 text-cyan-200" /></div>
            <p className="mt-3 font-display text-4xl text-cyan-100">{summary.reorderUnits}</p>
            <p className="mt-2 text-xs text-white/50">System estimate to refill visible inventory gaps.</p>
          </div>
        </div>

        <div className="mb-4 mt-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Inventory controls</p>
            <p className="text-sm text-white/60">{pagination.total} inventory records found · {summary.totalUnits} total units on hand</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_minmax(0,220px)]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by part, SKU, brand, model, category, or warehouse" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40" />
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as "ALL" | "CRITICAL" | "LOW" | "HEALTHY")} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink">
              <option value="ALL">All stock states</option>
              <option value="CRITICAL">Critical only</option>
              <option value="LOW">Low stock only</option>
              <option value="HEALTHY">Healthy stock only</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {items.map((item) => {
            const health = healthState(item);
            const suggestedReorder = Math.max(reorderSuggestion(item), 0);

            return (
              <div key={item.id} className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm lg:grid-cols-[1.2fr_1fr_auto]">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{item.product.name}</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${health.chip}`}>{health.label}</span>
                    </div>
                    <p className="mt-2 text-white/60">{item.product.brand.name} · {item.product.model.name} · {item.product.category.name}</p>
                    <p className="text-white/40">SKU {item.product.sku} · Price {formatCurrency(Number(item.product.price))}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-black/10 p-4 text-white/75"><p className="text-[11px] uppercase tracking-[0.16em] text-white/45">On hand</p><p className={`mt-2 text-lg font-semibold ${health.tone}`}>{item.stock}</p></div>
                    <div className="rounded-2xl bg-black/10 p-4 text-white/75"><p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Low-stock line</p><p className="mt-2 text-lg font-semibold text-white">{item.lowStockLimit}</p></div>
                    <div className="rounded-2xl bg-black/10 p-4 text-white/75"><p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Suggested reorder</p><p className="mt-2 text-lg font-semibold text-cyan-200">{suggestedReorder}</p></div>
                  </div>
                  <p className="text-xs text-white/45">{item.lastRestockedAt ? `Last restocked ${formatDate(item.lastRestockedAt)}` : "No restock date recorded yet."}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input type="number" value={item.stock} onChange={(event) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, stock: Number(event.target.value) } : entry)))} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                  <input type="number" value={item.lowStockLimit} onChange={(event) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, lowStockLimit: Number(event.target.value) } : entry)))} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                  <input value={item.warehouseCode ?? ""} onChange={(event) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, warehouseCode: event.target.value } : entry)))} placeholder="Warehouse" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10" onClick={async () => {
                    try {
                      const response = await api.patch(`/admin/inventory/${item.id}`, { stock: item.stock, lowStockLimit: item.lowStockLimit, warehouseCode: item.warehouseCode || undefined }, authHeaders(token));
                      setItems((current) => current.map((entry) => (entry.id === item.id ? response.data : entry)));
                      toast.success("Inventory updated");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Unable to update inventory"));
                    }
                  }}>Save</button>
                  {suggestedReorder > 0 ? <button type="button" onClick={() => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, stock: entry.stock + suggestedReorder } : entry)))} className="rounded-full bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25">Apply suggested reorder</button> : null}
                </div>
              </div>
            );
          })}
          {!items.length ? <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">No inventory records match the current search and filters.</div> : null}
          {pagination.pages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={pagination.page === 1} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10">Previous</button>
              {pageNumbers.map((entry, index) => {
                const previousPage = pageNumbers[index - 1];
                const showGap = previousPage && entry - previousPage > 1;
                return (
                  <div key={entry} className="flex items-center gap-3">
                    {showGap ? <span className="text-white/40">…</span> : null}
                    <button type="button" onClick={() => setPage(entry)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${entry === pagination.page ? "bg-accent text-white" : "border border-white/10 text-white hover:bg-white/10"}`}>{entry}</button>
                  </div>
                );
              })}
              <button type="button" onClick={() => setPage((current) => Math.min(current + 1, pagination.pages))} disabled={pagination.page === pagination.pages} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10">Next</button>
            </div>
          ) : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
