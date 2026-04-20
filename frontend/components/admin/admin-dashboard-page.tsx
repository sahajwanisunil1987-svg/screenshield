"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminTheme } from "@/hooks/use-admin-theme";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export function AdminDashboardPageClient() {
  const token = useAuthStore((state) => state.token);
  const { isDark } = useAdminTheme();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    api
      .get("/admin/dashboard", {
        ...authHeaders(token),
        params: { range }
      })
      .then((response) => setData(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load dashboard"));
      })
      .finally(() => setIsLoading(false));
  }, [range, token]);

  const stats = useMemo(
    () => [
      {
        label: "Net Orders",
        value: data?.stats?.totalOrders ?? 0,
        detail: `Valid orders in the last ${range.replace("d", "")} days`,
        accent: "text-cyan-200"
      },
      {
        label: "Net Revenue",
        value: formatCurrency(data?.stats?.totalRevenue ?? 0),
        detail: "Cancelled and approved-return orders excluded",
        accent: "text-emerald-200"
      },
      {
        label: "Pending Approvals",
        value: (data?.stats?.pendingCancelApprovals ?? 0) + (data?.stats?.pendingReturnApprovals ?? 0),
        detail: "Cancellation and return requests awaiting review",
        accent: "text-rose-200"
      },
      {
        label: "Dispatch Queue",
        value: (data?.stats?.awaitingPacking ?? 0) + (data?.stats?.awaitingShipment ?? 0),
        detail: "Orders waiting for packing or shipment",
        accent: "text-amber-200"
      }
    ],
    [data, range]
  );

  const topSellerMax = Math.max(...(data?.topProducts?.map((product: any) => Number(product.quantity ?? 0)) ?? [1]));
  const lowStockCriticalCount = data?.lowStock?.filter((item: any) => item.stock <= Math.max(1, Math.floor(item.lowStockLimit / 2))).length ?? 0;
  const fulfilledCount = data?.stats?.fulfilledOrders ?? 0;
  const trendMax = Math.max(...(data?.trend?.map((point: any) => Number(point.revenue ?? 0)) ?? [1]));
  const panelClass = isDark
    ? "rounded-[28px] border border-white/10 bg-white/5 p-6"
    : "rounded-[28px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_60px_rgba(11,18,32,0.08)]";
  const mutedPanelClass = isDark
    ? "rounded-[22px] border border-white/10 bg-black/10 p-4"
    : "rounded-[22px] border border-slate-200/80 bg-slate-50 p-4";
  const emptyStateClass = isDark
    ? "rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50"
    : "rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate";

  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div
            className={`rounded-[32px] border p-6 ${
              isDark
                ? "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"
                : "border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,248,252,0.98))] shadow-[0_28px_70px_rgba(11,18,32,0.08)]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-cyan-100/70" : "text-accent/80"}`}>PurjiX control room</p>
                <div>
                  <h2 className={`font-display text-3xl ${isDark ? "text-white" : "text-ink"}`}>Operations snapshot</h2>
                  <p className={`mt-2 max-w-2xl text-sm ${isDark ? "text-white/65" : "text-slate"}`}>
                    Monitor order flow, watch low-stock pressure, and jump straight into the admin modules that need action.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["7d", "30d", "90d"] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setRange(entry)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      range === entry
                        ? isDark
                          ? "bg-white text-ink"
                          : "bg-ink text-white shadow-[0_10px_24px_rgba(11,18,32,0.14)]"
                        : isDark
                          ? "border border-white/15 text-white/80 hover:bg-white/10"
                          : "border border-slate-200 bg-white/80 text-slate hover:bg-white hover:text-ink"
                    }`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div className={`mt-3 flex flex-wrap gap-2 text-xs ${isDark ? "text-white/55" : "text-slate"}`}>
              <span className={isDark ? "rounded-full border border-white/10 bg-white/5 px-3 py-1" : "rounded-full border border-slate-200 bg-white px-3 py-1 shadow-[0_8px_20px_rgba(11,18,32,0.05)]"}>Net sales view</span>
              <span className={isDark ? "rounded-full border border-white/10 bg-white/5 px-3 py-1" : "rounded-full border border-slate-200 bg-white px-3 py-1 shadow-[0_8px_20px_rgba(11,18,32,0.05)]"}>Cancelled and approved returns are excluded</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className={`min-w-0 rounded-[28px] border p-5 ${isDark ? "border-white/10 bg-black/15" : "border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(11,18,32,0.06)]"}`}>
                  <p className={`text-sm ${isDark ? "text-white/60" : "text-slate"}`}>{stat.label}</p>
                  <p className={`mt-3 break-words font-display text-[clamp(2.2rem,3vw,3.8rem)] leading-[0.92] ${stat.accent}`}>{isLoading ? "..." : stat.value}</p>
                  <p className={`mt-2 max-w-[16rem] text-xs leading-5 ${isDark ? "text-white/45" : "text-slate"}`}>{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[32px] border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white/92 shadow-[0_28px_70px_rgba(11,18,32,0.08)]"}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/50" : "text-slate"}`}>Today&apos;s focus</p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4">
                  <p className={`text-sm ${isDark ? "text-rose-100/80" : "text-rose-700"}`}>Pending approvals</p>
                  <p className={`mt-2 text-2xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>
                    {isLoading ? "..." : (data?.stats?.pendingCancelApprovals ?? 0) + (data?.stats?.pendingReturnApprovals ?? 0)}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-slate"}`}>
                    {data?.stats?.pendingCancelApprovals ?? 0} cancel and {data?.stats?.pendingReturnApprovals ?? 0} return requests
                  </p>
                </div>
                <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4">
                  <p className={`text-sm ${isDark ? "text-amber-100/80" : "text-amber-700"}`}>Dispatch queue</p>
                  <p className={`mt-2 text-2xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{isLoading ? "..." : (data?.stats?.awaitingPacking ?? 0) + (data?.stats?.awaitingShipment ?? 0)}</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-slate"}`}>
                    {data?.stats?.awaitingPacking ?? 0} awaiting packing, {data?.stats?.awaitingShipment ?? 0} awaiting shipment
                  </p>
                </div>
                <div className={mutedPanelClass}>
                  <p className={`text-sm ${isDark ? "text-white/60" : "text-slate"}`}>Low-stock alerts</p>
                  <p className={`mt-2 text-2xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{isLoading ? "..." : data?.stats?.lowStockCount ?? 0}</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-slate"}`}>{lowStockCriticalCount} items are in the critical band</p>
                </div>
                <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className={`text-sm ${isDark ? "text-emerald-100/80" : "text-emerald-700"}`}>Fulfilment pulse</p>
                  <p className={`mt-2 text-2xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{isLoading ? "..." : fulfilledCount}</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-slate"}`}>{data?.stats?.deliveredToday ?? 0} delivered today in production</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/admin/orders" className={`rounded-[22px] border px-4 py-3 text-sm font-medium transition ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-slate-200 bg-white text-ink hover:bg-slate-50"}`}>
                  Review orders
                </Link>
                <Link
                  href="/admin/inventory"
                  className={`rounded-[22px] border px-4 py-3 text-sm font-medium transition ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-slate-200 bg-white text-ink hover:bg-slate-50"}`}
                >
                  Update inventory
                </Link>
                <Link
                  href="/admin/orders"
                  className={`rounded-[22px] border px-4 py-3 text-sm font-medium transition ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-slate-200 bg-white text-ink hover:bg-slate-50"}`}
                >
                  Review returns
                </Link>
                <Link
                  href="/admin/products/new"
                  className={`rounded-[22px] border px-4 py-3 text-sm font-medium transition ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-slate-200 bg-white text-ink hover:bg-slate-50"}`}
                >
                  Create product
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Revenue trend</h3>
              <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-accent/80"}`}>{range} view</span>
            </div>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(24px,1fr))] items-end gap-3">
              {isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className={`h-28 animate-pulse rounded-t-[18px] ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                  ))
                : data?.trend?.map((point: any) => {
                    const height = Math.max(14, Math.round((Number(point.revenue ?? 0) / trendMax) * 160));
                    return (
                      <div key={point.date} className="space-y-2 text-center">
                        <div className="flex h-44 items-end justify-center">
                          <div
                            className="w-full rounded-t-[18px] bg-gradient-to-t from-cyan-400 to-emerald-300"
                            style={{ height: `${height}px` }}
                            title={`${point.label}: ${formatCurrency(Number(point.revenue ?? 0))} · ${point.orders} orders`}
                          />
                        </div>
                        <p className={`text-[11px] ${isDark ? "text-white/45" : "text-slate"}`}>{point.label}</p>
                      </div>
                    );
                  })}
            </div>
          </div>
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recent orders</h3>
              <Link href="/admin/orders" className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-accent/80"}`}>
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={`h-20 animate-pulse rounded-[24px] ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                ))
              ) : data?.recentOrders?.length ? (
                data.recentOrders.map((order: any) => (
                  <div key={order.id} className={`${mutedPanelClass} ${isDark ? "text-white/80" : "text-slate"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={`font-medium ${isDark ? "text-white" : "text-ink"}`}>{order.orderNumber}</p>
                        <p className={`mt-1 ${isDark ? "text-white/50" : "text-slate"}`}>{order.user?.name}</p>
                        <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-slate"}`}>
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "bg-cyan-500/15 text-cyan-200" : "bg-cyan-500/12 text-cyan-700"}`}>
                          {order.status}
                        </span>
                        <p className={`mt-3 text-sm ${isDark ? "text-white/60" : "text-slate"}`}>{formatCurrency(Number(order.totalAmount ?? 0))}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate">
                  No recent orders yet. As soon as orders start moving, this panel will surface the latest operational activity.
                </p>
              )}
            </div>
          </div>
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Top sellers</h3>
              <Link href="/admin/products" className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-accent/80"}`}>
                Manage catalog
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className={`h-12 animate-pulse rounded-[18px] ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                ))
              ) : data?.topProducts?.length ? (
                data.topProducts.map((product: any, index: number) => {
                  const quantity = Number(product.quantity ?? 0);
                  const width = Math.max(12, Math.round((quantity / topSellerMax) * 100));

                  return (
                    <div key={product.productId} className={`${mutedPanelClass} ${isDark ? "text-white/80" : "text-slate"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`truncate font-medium ${isDark ? "text-white" : "text-ink"}`}>
                            {index + 1}. {product.productName}
                          </p>
                          <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-slate"}`}>Units sold in completed orders</p>
                        </div>
                        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-ink"}`}>{quantity}</span>
                      </div>
                      <div className={`mt-3 h-2.5 rounded-full ${isDark ? "bg-white/5" : "bg-slate-200/80"}`}>
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={emptyStateClass}>
                  No net product sales in this range yet. Completed sales will surface here automatically.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Sales mix</h3>
              <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-accent/80"}`}>Brand / category / model</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                { title: "Top brands", items: data?.topBrands ?? [] },
                { title: "Top categories", items: data?.topCategories ?? [] },
                { title: "Top models", items: data?.topModels ?? [] }
              ].map((section) => (
                <div key={section.title} className={mutedPanelClass}>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-ink"}`}>{section.title}</p>
                  <div className={`mt-3 space-y-3 text-sm ${isDark ? "text-white/75" : "text-slate"}`}>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className={`h-8 animate-pulse rounded-full ${isDark ? "bg-white/5" : "bg-white"}`} />
                      ))
                    ) : section.items.length ? (
                      section.items.map((item: any) => (
                        <div key={item.name} className="flex items-center justify-between gap-3">
                          <span>{item.name}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-white/10 text-white" : "bg-white text-ink shadow-[0_8px_18px_rgba(11,18,32,0.05)]"}`}>{item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <p className={isDark ? "text-white/45" : "text-slate"}>No net sales data in this range.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Low stock alerts</h3>
              <Link href="/admin/inventory" className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-accent/80"}`}>
                Open inventory
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={`h-14 animate-pulse rounded-[18px] ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                ))
              ) : data?.lowStock?.length ? (
                data.lowStock.map((item: any) => (
                  <div key={item.id} className={`flex items-center justify-between gap-3 ${mutedPanelClass} ${isDark ? "text-white/80" : "text-slate"}`}>
                    <div>
                      <p className={`font-medium ${isDark ? "text-white" : "text-ink"}`}>{item.product.name}</p>
                      <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-slate"}`}>SKU {item.product.sku}</p>
                    </div>
                    <span className={`rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? "text-amber-200" : "text-amber-700"}`}>
                      {item.stock}/{item.lowStockLimit}
                    </span>
                  </div>
                ))
              ) : (
                <p className={emptyStateClass}>
                  No low stock alerts right now.
                </p>
              )}
            </div>
          </div>
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recent customers</h3>
              <Link href="/admin/users" className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-accent/80"}`}>
                View customers
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={`h-14 animate-pulse rounded-[18px] ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                ))
              ) : data?.users?.length ? (
                data.users.slice(0, 6).map((user: any) => (
                  <div key={user.id} className={`flex items-center justify-between gap-3 ${mutedPanelClass} ${isDark ? "text-white/80" : "text-slate"}`}>
                    <div>
                      <p className={`font-medium ${isDark ? "text-white" : "text-ink"}`}>{user.name}</p>
                      <p className={isDark ? "text-white/50" : "text-slate"}>{user.email}</p>
                    </div>
                    <span className={`text-xs ${isDark ? "text-white/45" : "text-slate"}`}>
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={emptyStateClass}>
                  No customers registered yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
