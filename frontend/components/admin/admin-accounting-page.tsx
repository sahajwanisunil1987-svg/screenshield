"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type AccountingResponse = {
  range: "7d" | "30d" | "90d";
  summary: {
    grossSales: number;
    netSales: number;
    discounts: number;
    shippingCollected: number;
    taxCollected: number;
    costOfGoods: number;
    grossProfit: number;
    grossMarginPercent: number;
    netOrders: number;
    cancelledOrders: number;
    cancelledValue: number;
    returnedOrders: number;
    returnedValue: number;
    refundedValue: number;
    refundOutflow: number;
    cancellationRefunds: number;
    returnRefunds: number;
    codOrders: number;
    codValue: number;
    prepaidOrders: number;
    prepaidValue: number;
    pendingPaymentValue: number;
    taxableValue: number;
    cgstCollected: number;
    sgstCollected: number;
    averageNetOrderValue: number;
  };
  dailyBreakdown: Array<{
    date: string;
    label: string;
    grossSales: number;
    netSales: number;
    taxCollected: number;
    orders: number;
    refunds: number;
    costOfGoods: number;
    grossProfit: number;
  }>;
  topMarginProducts: Array<{
    productId: string;
    productName: string;
    productSku: string;
    revenue: number;
    cost: number;
    grossProfit: number;
    units: number;
    marginPercent: number;
  }>;
  topReturnProducts: Array<{
    productId: string;
    productName: string;
    productSku: string;
    requests: number;
    approvedReturns: number;
    refundedAmount: number;
  }>;
  reasonAnalytics: {
    cancellation: Array<{ reason: string; count: number; refundAmount: number }>;
    return: Array<{ reason: string; count: number; refundAmount: number }>;
    refund: Array<{ reason: string; count: number; refundAmount: number }>;
  };
  lowMarginOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    estimatedCost: number;
    grossProfit: number;
    marginPercent: number;
  }>;
  reportOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    estimatedCost: number;
    grossProfit: number;
    marginPercent: number;
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
    refundAmount: number;
    refundReason?: string | null;
    customerName: string;
    customerEmail?: string | null;
    returnRequestStatus?: string | null;
  }>;
};

export function AdminAccountingPageClient() {
  const token = useAuthStore((state) => state.token);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<AccountingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    api
      .get<AccountingResponse>("/admin/accounting", {
        ...authHeaders(token),
        params: { range }
      })
      .then((response) => setData(response.data))
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load accounting")))
      .finally(() => setIsLoading(false));
  }, [range, token]);

  const cards = useMemo(
    () => [
      {
        label: "Gross Sales",
        value: formatCurrency(data?.summary?.grossSales ?? 0),
        detail: "Subtotal before cancellations, returns, and refunds",
        accent: "text-cyan-200"
      },
      {
        label: "Net Sales",
        value: formatCurrency(data?.summary?.netSales ?? 0),
        detail: "Cancelled and approved-return orders excluded",
        accent: "text-emerald-200"
      },
      {
        label: "Gross Profit",
        value: formatCurrency(data?.summary?.grossProfit ?? 0),
        detail: "Net sales minus estimated product cost",
        accent: "text-amber-200"
      },
      {
        label: "Margin %",
        value: `${(data?.summary?.grossMarginPercent ?? 0).toFixed(1)}%`,
        detail: `${data?.summary?.netOrders ?? 0} net orders in the selected range`,
        accent: "text-rose-200"
      }
    ],
    [data]
  );

  const exportCsv = async () => {
    if (!token) return;
    try {
      setIsExporting(true);
      const response = await api.get<Blob>("/admin/accounting/export", {
        ...authHeaders(token),
        params: { range },
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `accounting-${range}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export accounting CSV"));
    } finally {
      setIsExporting(false);
    }
  };

  const gstCards = useMemo(
    () => [
      { label: "Taxable Value", value: formatCurrency(data?.summary?.taxableValue ?? 0), detail: "Net value before GST in this range" },
      { label: "CGST", value: formatCurrency(data?.summary?.cgstCollected ?? 0), detail: "Half of GST collected on orders" },
      { label: "SGST", value: formatCurrency(data?.summary?.sgstCollected ?? 0), detail: "Half of GST collected on orders" }
    ],
    [data]
  );

  const impactCards = useMemo(
    () => [
      { label: "Cancelled", value: `${data?.summary?.cancelledOrders ?? 0}`, detail: `${formatCurrency(data?.summary?.cancelledValue ?? 0)} cancelled order value` },
      { label: "Returned", value: `${data?.summary?.returnedOrders ?? 0}`, detail: `${formatCurrency(data?.summary?.returnedValue ?? 0)} approved returns` },
      { label: "Refunded", value: formatCurrency(data?.summary?.refundedValue ?? 0), detail: "Actual refunded amount processed in this range" }
    ],
    [data]
  );

  const riskCards = useMemo(
    () => [
      {
        label: "Discounts",
        value: formatCurrency(data?.summary?.discounts ?? 0),
        detail: "Total discount value applied to orders"
      },
      {
        label: "Refund outflow",
        value: formatCurrency(data?.summary?.refundOutflow ?? 0),
        detail: `${data?.summary?.returnedOrders ?? 0} returned orders / ${data?.summary?.cancelledOrders ?? 0} cancelled orders`
      },
      {
        label: "Pending Payments",
        value: formatCurrency(data?.summary?.pendingPaymentValue ?? 0),
        detail: "Orders still waiting for payment capture"
      },
      {
        label: "Shipping Collected",
        value: formatCurrency(data?.summary?.shippingCollected ?? 0),
        detail: "Shipping charges collected from customers"
      },
      {
        label: "Cost of Goods",
        value: formatCurrency(data?.summary?.costOfGoods ?? 0),
        detail: "Estimated cost based on latest recorded purchase rates"
      }
    ],
    [data]
  );

  return (
    <AdminGuard>
      <AdminShell title="Accounting">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Finance summary</p>
                <h2 className="mt-2 font-display text-3xl text-white">Accounting snapshot</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Monitor gross versus net sales, refunds, tax collection, and payment mix without leaving the admin panel.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={isExporting || isLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting" : "Export CSV"}
                </button>
                {(["7d", "30d", "90d"] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setRange(entry)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      range === entry ? "bg-white text-ink" : "border border-white/15 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {cards.map((card) => (
                <div key={card.label} className="rounded-[28px] border border-white/10 bg-black/15 p-5">
                  <p className="text-sm text-white/60">{card.label}</p>
                  <p className={`mt-3 break-words font-display text-[clamp(2rem,3vw,3.6rem)] leading-[0.92] ${card.accent}`}>
                    {isLoading ? "..." : card.value}
                  </p>
                  <p className="mt-2 max-w-[16rem] text-xs leading-5 text-white/45">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Payment mix</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-100/80">COD pending collection</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : data?.summary?.codOrders ?? 0}</p>
                <p className="mt-1 text-xs text-white/55">{formatCurrency(data?.summary?.codValue ?? 0)} delivered cash still awaiting reconciliation</p>
              </div>
              <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-4">
                <p className="text-sm text-cyan-100/80">Prepaid attempts</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : data?.summary?.prepaidOrders ?? 0}</p>
                <p className="mt-1 text-xs text-white/55">{formatCurrency(data?.summary?.prepaidValue ?? 0)} successfully captured prepaid value</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {riskCards.map((card) => (
                <div key={card.label} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/70">{card.label}</p>
                    <p className="text-base font-semibold text-white">{isLoading ? "..." : card.value}</p>
                  </div>
                  <p className="mt-1 text-xs text-white/45">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Accounting report</h3>
              <p className="mt-1 text-sm text-white/50">Order-wise sales, tax, discount, and refund impact for the selected range.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[24px] bg-white/5" />
              ))
) : data?.reportOrders?.length ? (
              data.reportOrders.map((order) => (
                <div key={order.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4 text-white/80">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{order.orderNumber}</p>
                      <p className="mt-1 text-white/50">{order.customerName}</p>
                      <p className="mt-1 text-xs text-white/40">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">{formatCurrency(order.totalAmount)}</p>
                      <div className="mt-2 flex flex-wrap justify-end gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200">{order.status}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{order.paymentStatus === "COD" ? "COD Pending Collection" : order.paymentStatus === "PAID" && order.status === "DELIVERED" ? "COD Collected" : order.paymentStatus}</span>
                        {order.returnRequestStatus === "APPROVED" ? <span className="rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">Returned</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs text-white/55">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Discount</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(order.discountAmount)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Shipping</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(order.shippingAmount)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">GST</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(order.taxAmount)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Est. Cost</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(order.estimatedCost)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Gross Profit</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(order.grossProfit)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Margin %</p>
                      <p className="mt-1 text-sm font-semibold text-white">{order.marginPercent.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Refund</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(order.refundAmount)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 sm:col-span-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Customer</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{order.customerEmail ?? "Email unavailable"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                No orders were created in this range, so there is no accounting report to export yet.
              </p>
            )}
          </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">GST summary</p>
              <div className="mt-4 grid gap-3">
                {gstCards.map((card) => (
                  <div key={card.label} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white/70">{card.label}</p>
                      <p className="text-base font-semibold text-white">{isLoading ? "..." : card.value}</p>
                    </div>
                    <p className="mt-1 text-xs text-white/45">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Impact summary</p>
              <div className="mt-4 grid gap-3">
                {impactCards.map((card) => (
                  <div key={card.label} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white/70">{card.label}</p>
                      <p className="text-base font-semibold text-white">{isLoading ? "..." : card.value}</p>
                    </div>
                    <p className="mt-1 text-xs text-white/45">{card.detail}</p>
                  </div>
                ))}
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/70">Cancelled refund</p>
                    <p className="text-base font-semibold text-white">{isLoading ? "..." : formatCurrency(data?.summary?.cancellationRefunds ?? 0)}</p>
                  </div>
                  <p className="mt-1 text-xs text-white/45">Actual refund outflow tied to cancelled prepaid orders.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/70">Return refund</p>
                    <p className="text-base font-semibold text-white">{isLoading ? "..." : formatCurrency(data?.summary?.returnRefunds ?? 0)}</p>
                  </div>
                  <p className="mt-1 text-xs text-white/45">Actual refund outflow tied to approved returns.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Margin snapshot</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-emerald-100/80">Gross profit</p>
                    <p className="text-base font-semibold text-white">{isLoading ? "..." : formatCurrency(data?.summary?.grossProfit ?? 0)}</p>
                  </div>
                  <p className="mt-1 text-xs text-white/45">After subtracting estimated product purchase cost.</p>
                </div>
                <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-cyan-100/80">Margin rate</p>
                    <p className="text-base font-semibold text-white">{isLoading ? "..." : `${(data?.summary?.grossMarginPercent ?? 0).toFixed(1)}%`}</p>
                  </div>
                  <p className="mt-1 text-xs text-white/45">Net sales margin based on latest purchase rates.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Top margin products</p>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-[20px] bg-white/5" />)
                ) : data?.topMarginProducts?.length ? (
                  data.topMarginProducts.slice(0, 3).map((item) => (
                    <div key={item.productId} className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{item.productName}</p>
                          <p className="mt-1 text-xs text-white/45">{item.productSku} · {item.units} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-200">{formatCurrency(item.grossProfit)}</p>
                          <p className="mt-1 text-xs text-white/45">{item.marginPercent.toFixed(1)}% margin</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[20px] border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-white/50">
                    Margin data will appear once purchases and sales overlap.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Low margin watchlist</p>
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-[20px] bg-white/5" />)
                ) : data?.lowMarginOrders?.length ? (
                  data.lowMarginOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{order.orderNumber}</p>
                          <p className="mt-1 text-xs text-white/45">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-amber-200">{order.marginPercent.toFixed(1)}%</p>
                          <p className="mt-1 text-xs text-white/45">{formatCurrency(order.grossProfit)} profit</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[20px] border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-white/50">
                    No low-margin net orders in this range.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Return-prone products</p>
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-[20px] bg-white/5" />)
                ) : data?.topReturnProducts?.length ? (
                  data.topReturnProducts.map((item) => (
                    <div key={item.productId} className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{item.productName}</p>
                          <p className="mt-1 text-xs text-white/45">{item.productSku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-rose-200">{item.approvedReturns} approved</p>
                          <p className="mt-1 text-xs text-white/45">{item.requests} requests · {formatCurrency(item.refundedAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[20px] border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-white/50">
                    No return-heavy products in this range.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Reason analytics</p>
              <div className="mt-4 grid gap-3">
                {[
                  { label: "Cancel reasons", items: data?.reasonAnalytics?.cancellation ?? [] },
                  { label: "Return reasons", items: data?.reasonAnalytics?.return ?? [] },
                  { label: "Refund reasons", items: data?.reasonAnalytics?.refund ?? [] }
                ].map((section) => (
                  <div key={section.label} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{section.label}</p>
                    <div className="mt-3 space-y-2">
                      {isLoading ? (
                        <div className="h-10 animate-pulse rounded-xl bg-white/5" />
                      ) : section.items.length ? (
                        section.items.slice(0, 3).map((item) => (
                          <div key={`${section.label}-${item.reason}`} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-white">{item.reason}</p>
                              <p className="mt-1 text-xs text-white/45">{item.count} cases</p>
                            </div>
                            <p className="text-xs font-semibold text-white/70">{formatCurrency(item.refundAmount)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-white/45">No data in this range.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Daily breakdown</h3>
                  <p className="mt-1 text-sm text-white/50">Gross vs net sales with actual refund outflow by day.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-[20px] bg-white/5" />)
                ) : data?.dailyBreakdown?.length ? (
                  data.dailyBreakdown.slice(0, 7).map((entry) => (
                    <div key={entry.date} className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{entry.label}</p>
                          <p className="mt-1 text-xs text-white/45">{entry.orders} orders • {formatCurrency(entry.taxCollected)} GST</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-200">{formatCurrency(entry.netSales)}</p>
                          <p className="mt-1 text-xs text-white/45">Gross {formatCurrency(entry.grossSales)} · Refund outflow {formatCurrency(entry.refunds)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[20px] border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-white/50">
                    No daily data available for this range yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
