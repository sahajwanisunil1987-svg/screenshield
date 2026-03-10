"use client";

import { useEffect, useMemo, useState } from "react";
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
    netOrders: number;
    cancelledOrders: number;
    cancelledValue: number;
    returnedOrders: number;
    returnedValue: number;
    refundedValue: number;
    codOrders: number;
    codValue: number;
    prepaidOrders: number;
    prepaidValue: number;
    pendingPaymentValue: number;
    averageNetOrderValue: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
    customerName: string;
    customerEmail?: string | null;
    returnRequestStatus?: string | null;
  }>;
};

export default function AdminAccountingPage() {
  const token = useAuthStore((state) => state.token);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<AccountingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        label: "GST Collected",
        value: formatCurrency(data?.summary?.taxCollected ?? 0),
        detail: "Tax component across orders in this range",
        accent: "text-amber-200"
      },
      {
        label: "Average Net Order",
        value: formatCurrency(data?.summary?.averageNetOrderValue ?? 0),
        detail: `${data?.summary?.netOrders ?? 0} net orders in the selected range`,
        accent: "text-rose-200"
      }
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
        label: "Refunded",
        value: formatCurrency(data?.summary?.refundedValue ?? 0),
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
              <div className="flex flex-wrap gap-2">
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
                <p className="text-sm text-emerald-100/80">COD orders</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : data?.summary?.codOrders ?? 0}</p>
                <p className="mt-1 text-xs text-white/55">{formatCurrency(data?.summary?.codValue ?? 0)} net COD value</p>
              </div>
              <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-4">
                <p className="text-sm text-cyan-100/80">Prepaid orders</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : data?.summary?.prepaidOrders ?? 0}</p>
                <p className="mt-1 text-xs text-white/55">{formatCurrency(data?.summary?.prepaidValue ?? 0)} captured prepaid value</p>
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

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Recent accounting activity</h3>
              <p className="mt-1 text-sm text-white/50">Latest orders that affect sales, refunds, and tax totals.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[24px] bg-white/5" />
              ))
            ) : data?.recentOrders?.length ? (
              data.recentOrders.map((order) => (
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
                        <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{order.paymentStatus}</span>
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
                      <p className="uppercase tracking-[0.16em] text-white/35">Customer</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{order.customerEmail ?? "Email unavailable"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                No orders were created in this range, so there is no accounting activity to report yet.
              </p>
            )}
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
