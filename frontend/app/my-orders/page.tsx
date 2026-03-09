"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { Order } from "@/types";

export default function MyOrdersPage() {
  useAuthGuard("CUSTOMER");
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/orders/my-orders", authHeaders(token))
      .then((response) => setOrders(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load your orders"));
      });
  }, [token]);

  const requestCancellation = async (orderId: string) => {
    if (!token) return;
    const reason = window.prompt("Reason for cancellation request");
    if (!reason) return;

    try {
      const response = await api.post<Order>(`/orders/${orderId}/cancel-request`, { reason }, authHeaders(token));
      setOrders((current) => current.map((item) => (item.id === orderId ? response.data : item)));
      toast.success("Cancellation request submitted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to request cancellation"));
    }
  };

  const requestReturn = async (orderId: string) => {
    if (!token) return;
    const reason = window.prompt("Reason for return request");
    if (!reason) return;

    try {
      const response = await api.post<Order>(`/orders/${orderId}/return-request`, { reason }, authHeaders(token));
      setOrders((current) => current.map((item) => (item.id === orderId ? response.data : item)));
      toast.success("Return request submitted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to request return"));
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-ink">My orders</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate">Review order status, shipment details, invoices, and request cancellations before dispatch locks in.</p>
          </div>
          <Link href="/account" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white">Manage account</Link>
        </div>
        <div className="mt-10 space-y-4">
          {orders.length ? (
            orders.map((order) => (
              <div key={order.id} className="space-y-5 rounded-[28px] bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-slate">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                        {order.status}
                      </span>
                      <span className="rounded-full bg-[#f5f8fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                        {order.paymentStatus}
                      </span>
                      {order.cancelRequestedAt ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Cancel requested</span> : null}
                      {order.returnRequestedAt ? <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Return requested</span> : null}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-[#f5f8fb] p-4">
                      <p className="font-medium text-ink">{item.productName}</p>
                      <p className="mt-1 text-sm text-slate">SKU {item.productSku}</p>
                      <p className="mt-1 text-sm text-slate">Qty {item.quantity}</p>
                      <p className="mt-2 text-sm font-semibold text-ink">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
                {(order.shippingCourier || order.shippingAwb || order.estimatedDeliveryAt || order.adminNotes) ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Courier</p><p className="mt-2 font-semibold text-ink">{order.shippingCourier ?? "Pending"}</p></div>
                    <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">AWB</p><p className="mt-2 font-semibold text-ink">{order.shippingAwb ?? "Pending"}</p></div>
                    <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">ETA</p><p className="mt-2 font-semibold text-ink">{order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : "Pending"}</p></div>
                    <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Ops note</p><p className="mt-2 font-semibold text-ink">{order.adminNotes ?? "No note yet"}</p></div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Payment: {order.paymentStatus}</span>
                    <span>Items: {order.items.length}</span>
                    {order.invoice?.invoiceNumber ? <span>Invoice: {order.invoice.invoiceNumber}</span> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {order.invoice?.invoiceNumber ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 font-semibold text-slate underline"
                      >
                        <Download className="h-4 w-4" />
                        Download invoice
                      </a>
                    ) : null}
                    {(["PENDING", "CONFIRMED"].includes(order.status) && !order.cancelRequestedAt) ? (
                      <button type="button" onClick={() => requestCancellation(order.id)} className="font-semibold text-amber-700 underline">Request cancellation</button>
                    ) : null}
                    {(order.status === "DELIVERED" && !order.returnRequestedAt) ? (
                      <button type="button" onClick={() => requestReturn(order.id)} className="font-semibold text-sky-700 underline">Request return</button>
                    ) : null}
                    <Link href={`/track-order?orderNumber=${order.orderNumber}`} className="font-semibold text-accent underline">
                      Track order
                    </Link>
                  </div>
                </div>
                {order.cancelRequestReason ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Cancellation reason: {order.cancelRequestReason}</p> : null}
                {order.returnRequestReason ? <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Return reason: {order.returnRequestReason}</p> : null}
              </div>
            ))
          ) : (
            <EmptyState title="No orders yet" description="Your confirmed SpareKart purchases will show up here." />
          )}
        </div>
      </div>
    </PageShell>
  );
}
