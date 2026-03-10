"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { PaginatedResponse, Product } from "@/types";

const readinessState = (product: Product) => {
  const stock = product.inventory?.stock ?? product.stock;
  const hasImages = (product.images?.length ?? 0) > 0;
  const hasVideo = Boolean(product.videoUrl);
  const lowStockLimit = product.inventory?.lowStockLimit ?? 5;

  if (!product.isActive) {
    return { label: "Inactive", chip: "bg-white/10 text-white/75" };
  }

  if (!hasImages) {
    return { label: "Needs media", chip: "bg-rose-500/15 text-rose-200" };
  }

  if (stock <= lowStockLimit) {
    return { label: "Low stock", chip: "bg-amber-500/15 text-amber-200" };
  }

  if (!hasVideo) {
    return { label: "Image ready", chip: "bg-cyan-500/15 text-cyan-200" };
  }

  return { label: "Ready", chip: "bg-emerald-500/15 text-emerald-200" };
};

export default function AdminProductsPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [featureFilter, setFeatureFilter] = useState<"ALL" | "FEATURED" | "STANDARD">("ALL");
  const [opsFilter, setOpsFilter] = useState<"ALL" | "LOW_STOCK" | "MISSING_MEDIA" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);

  const load = () => {
    if (!token) return;
    const config = authHeaders(token);
    api
      .get<PaginatedResponse<Product>>("/admin/products", {
        ...config,
        params: {
          search: query || undefined,
          status: statusFilter,
          feature: featureFilter,
          page,
          limit: 12
        }
      })
      .then((response) => {
        setData(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load products"));
      });
  };

  useEffect(() => {
    load();
  }, [featureFilter, page, query, statusFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [featureFilter, query, statusFilter]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );


  const visibleProducts = useMemo(() => {
    return data.filter((product) => {
      const stock = product.inventory?.stock ?? product.stock;
      const lowStockLimit = product.inventory?.lowStockLimit ?? 5;
      const hasMedia = (product.images?.length ?? 0) > 0;

      if (opsFilter === "LOW_STOCK") return stock <= lowStockLimit;
      if (opsFilter === "MISSING_MEDIA") return !hasMedia;
      if (opsFilter === "INACTIVE") return !product.isActive;
      return true;
    });
  }, [data, opsFilter]);

  const summary = useMemo(() => ({
    lowStock: data.filter((product) => (product.inventory?.stock ?? product.stock) <= (product.inventory?.lowStockLimit ?? 5)).length,
    missingMedia: data.filter((product) => (product.images?.length ?? 0) === 0).length,
    inactive: data.filter((product) => !product.isActive).length,
    ready: data.filter((product) => readinessState(product).label === "Ready").length
  }), [data]);

  return (
    <AdminGuard>
      <AdminShell title="Products">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-white">
            <p className="text-sm text-white/65">Ready products</p>
            <p className="mt-3 font-display text-4xl text-emerald-100">{summary.ready}</p>
            <p className="mt-2 text-xs text-white/50">Active catalog items with media and safe stock.</p>
          </div>
          <div className="rounded-[28px] border border-amber-400/20 bg-amber-500/10 p-5 text-white">
            <p className="text-sm text-white/65">Low stock</p>
            <p className="mt-3 font-display text-4xl text-amber-100">{summary.lowStock}</p>
            <p className="mt-2 text-xs text-white/50">Products nearing their low-stock threshold.</p>
          </div>
          <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-5 text-white">
            <p className="text-sm text-white/65">Missing media</p>
            <p className="mt-3 font-display text-4xl text-rose-100">{summary.missingMedia}</p>
            <p className="mt-2 text-xs text-white/50">Catalog items that still need at least one image.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white">
            <p className="text-sm text-white/65">Inactive</p>
            <p className="mt-3 font-display text-4xl text-white">{summary.inactive}</p>
            <p className="mt-2 text-xs text-white/50">Products currently hidden from the storefront.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Catalog controls</p>
              <p className="text-sm text-white/60">
                {pagination.total} products found · page {pagination.page} of {pagination.pages}
              </p>
            </div>
            <Link href="/admin/products/new">
              <Button>New product</Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "ALL", label: "All products" },
              { key: "LOW_STOCK", label: "Low stock" },
              { key: "MISSING_MEDIA", label: "Missing media" },
              { key: "INACTIVE", label: "Inactive" }
            ].map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setOpsFilter(entry.key as typeof opsFilter)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  opsFilter === entry.key ? "bg-white text-ink" : "border border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,220px))]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, SKU, brand, model, or category"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
            <select
              value={featureFilter}
              onChange={(event) => setFeatureFilter(event.target.value as "ALL" | "FEATURED" | "STANDARD")}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All product types</option>
              <option value="FEATURED">Featured only</option>
              <option value="STANDARD">Standard only</option>
            </select>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="space-y-4">
            {visibleProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-4 border-b border-white/10 pb-4 text-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{product.name}</p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${readinessState(product).chip}`}>
                      {readinessState(product).label}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-white/75">{product.isActive ? "Active" : "Inactive"}</span>
                    <span className="rounded-full bg-teal-500/20 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-teal-100">{product.isFeatured ? "Featured" : "Standard"}</span>
                  </div>
                  <p className="mt-2 text-white/60">
                    {product.sku} · {product.brand.name} · {product.model.name} · {product.category.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                    <span>Stock {product.inventory?.stock ?? product.stock}</span>
                    <span>{product.images?.length ?? 0} image(s)</span>
                    <span>{product.videoUrl ? "Video added" : "No video"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  <Link href={`/products/${product.slug}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/10">
                    Open live
                  </Link>
                  <Link href={`/admin/inventory?search=${encodeURIComponent(product.sku)}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/10">
                    Inventory
                  </Link>
                  <Link href={`/admin/products/edit/${product.id}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200 transition hover:bg-white/10">
                    Edit
                  </Link>
                  <button
                    className="rounded-full border border-rose-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/10"
                    onClick={async () => {
                      try {
                        await api.delete(`/admin/products/${product.id}`, authHeaders(token));
                        toast.success("Product deleted");
                        load();
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete product"));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!visibleProducts.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
                No products match the current search and filters.
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
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
