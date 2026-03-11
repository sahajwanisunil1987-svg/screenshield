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

const getCustomerPaymentLabel = (order: Order) => {
  if (order.paymentStatus === "COD" && order.status === "DELIVERED") return "COD reconciliation pending";
  if (order.paymentStatus === "PAID" && order.status === "DELIVERED") return "COD collected";
  if (order.paymentStatus === "COD") return "COD pending collection";
  if (order.paymentStatus === "PENDING") return "Payment pending";
  if (order.paymentStatus === "FAILED") return "Payment failed";
  if (order.paymentStatus === "REFUNDED") return "Refunded";
  return order.paymentStatus;
};

export default function MyOrdersPage() {
  useAuthGuard("CUSTOMER");
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get("/orders/my-orders", authHeaders(token))
      .then((response) => setOrders(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load your orders"));
      });
  }, [token]);

  const downloadInvoice = async (orderId: string, orderNumber: string) => {
    if (!token) return;

    setDownloadingId(orderId);
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        ...authHeaders(token),
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to download invoice"));
    } finally {
      setDownloadingId(null);
    }
  };

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
                        {getCustomerPaymentLabel(order)}
                      </span>
                      {order.cancelRequestStatus === "PENDING" ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Cancel requested</span> : null}
                      {order.cancelRequestStatus === "APPROVED" ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Cancel approved</span> : null}
                      {order.cancelRequestStatus === "REJECTED" ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Cancel declined</span> : null}
                      {order.returnRequestStatus === "PENDING" ? <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Return requested</span> : null}
                      {order.returnRequestStatus === "APPROVED" ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Return approved</span> : null}
                      {order.returnRequestStatus === "REJECTED" ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Return declined</span> : null}
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
                    <span>Payment: {getCustomerPaymentLabel(order)}</span>
                    <span>Items: {order.items.length}</span>
                    {order.invoice?.invoiceNumber ? <span>Invoice: {order.invoice.invoiceNumber}</span> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {order.invoice?.invoiceNumber ? (
                      <button
                        type="button"
                        onClick={() => downloadInvoice(order.id, order.orderNumber)}
                        disabled={downloadingId === order.id}
                        className="inline-flex items-center gap-2 font-semibold text-slate underline disabled:cursor-not-allowed disabled:text-slate/50"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === order.id ? "Downloading..." : "Download invoice"}
                      </button>
                    ) : null}
                    {(["PENDING", "CONFIRMED"].includes(order.status) && !order.cancelRequestStatus) ? (
                      <button type="button" onClick={() => requestCancellation(order.id)} className="font-semibold text-amber-700 underline">Request cancellation</button>
                    ) : null}
                    {(order.status === "DELIVERED" && !order.returnRequestStatus) ? (
                      <button type="button" onClick={() => requestReturn(order.id)} className="font-semibold text-sky-700 underline">Request return</button>
                    ) : null}
                    <Link href={`/track-order?orderNumber=${order.orderNumber}`} className="font-semibold text-accent underline">
                      Track order
                    </Link>
                  </div>
                </div>
                {order.cancelRequestReason ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Cancellation reason: {order.cancelRequestReason}</p> : null}
                {order.cancelDecisionNote ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">Cancellation decision: {order.cancelDecisionNote}</p> : null}
                {order.returnRequestReason ? <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Return reason: {order.returnRequestReason}</p> : null}
                {order.returnDecisionNote ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">Return decision: {order.returnDecisionNote}</p> : null}
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
