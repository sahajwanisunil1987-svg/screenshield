"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { AdminOrder, PaginatedResponse } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const orderStatuses = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "COD"];

type OpsDraft = {
  status: string;
  paymentStatus: string;
  shippingCourier: string;
  shippingAwb: string;
  estimatedDeliveryAt: string;
  adminNotes: string;
};

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, OpsDraft>>({});

  const load = () => {
    if (!token) return;
    api
      .get<PaginatedResponse<AdminOrder>>("/admin/orders", {
        ...authHeaders(token),
        params: {
          search: query || undefined,
          status: statusFilter,
          paymentStatus: paymentFilter,
          page,
          limit: 8
        }
      })
      .then((response) => {
        setOrders(response.data.items);
        setPagination(response.data.pagination);
        setDrafts((current) => {
          const next = { ...current };
          for (const order of response.data.items) {
            next[order.id] = next[order.id] ?? {
              status: order.status,
              paymentStatus: order.paymentStatus,
              shippingCourier: order.shippingCourier ?? "",
              shippingAwb: order.shippingAwb ?? "",
              estimatedDeliveryAt: order.estimatedDeliveryAt ? String(order.estimatedDeliveryAt).slice(0, 10) : "",
              adminNotes: order.adminNotes ?? ""
            };
          }
          return next;
        });
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load orders")));
  };

  useEffect(() => {
    load();
  }, [page, paymentFilter, query, statusFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [paymentFilter, query, statusFilter]);

  const pageNumbers = useMemo(() =>
    Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
      entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
    ), [pagination.page, pagination.pages]);

  const setDraftField = (id: string, key: keyof OpsDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value
      }
    }));
  };

  const saveOps = async (order: AdminOrder) => {
    const draft = drafts[order.id];
    if (!draft) return;

    try {
      const response = await api.patch<AdminOrder>(`/admin/orders/${order.id}/status`, {
        status: draft.status,
        paymentStatus: draft.paymentStatus,
        shippingCourier: draft.shippingCourier || undefined,
        shippingAwb: draft.shippingAwb || undefined,
        estimatedDeliveryAt: draft.estimatedDeliveryAt ? new Date(`${draft.estimatedDeliveryAt}T12:00:00.000Z`).toISOString() : undefined,
        adminNotes: draft.adminNotes || undefined
      }, authHeaders(token));

      setOrders((current) => current.map((item) => (item.id === order.id ? response.data : item)));
      setDrafts((current) => ({
        ...current,
        [order.id]: {
          status: response.data.status,
          paymentStatus: response.data.paymentStatus,
          shippingCourier: response.data.shippingCourier ?? "",
          shippingAwb: response.data.shippingAwb ?? "",
          estimatedDeliveryAt: response.data.estimatedDeliveryAt ? String(response.data.estimatedDeliveryAt).slice(0, 10) : "",
          adminNotes: response.data.adminNotes ?? ""
        }
      }));
      toast.success("Order operations updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update order"));
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Orders">
        <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Order controls</p>
              <p className="text-sm text-white/60">{pagination.total} orders found · page {pagination.page} of {pagination.pages}</p>
            </div>
            <button type="button" onClick={load} className="text-sm text-white/60 underline">Refresh list</button>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1.5fr_repeat(2,minmax(0,220px))]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by order number, customer, email, or phone" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink">
              <option value="ALL">All order statuses</option>
              {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink">
              <option value="ALL">All payment states</option>
              {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {orders.map((order) => {
            const draft = drafts[order.id];
            return (
              <div key={order.id} className="space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{order.orderNumber}</p>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">{order.status}</span>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">{order.paymentStatus}</span>
                      {order.cancelRequestedAt ? <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">Cancel requested</span> : null}
                    </div>
                    <p className="text-white/60">Placed {formatDate(order.createdAt)} · {order.user.name} · {order.user.email}</p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-4 text-white/75">
                    <p>Subtotal: {formatCurrency(Number(order.subtotal))}</p>
                    <p className="mt-1">Discount: {formatCurrency(Number(order.discountAmount))}</p>
                    <p className="mt-1">Shipping: {formatCurrency(Number(order.shippingAmount))}</p>
                    <p className="mt-1">GST: {formatCurrency(Number(order.taxAmount))}</p>
                    <p className="mt-2 font-semibold text-white">Total: {formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/10 p-4 text-white/75">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Customer & destination</p>
                    <div>
                      <p className="font-medium text-white">{order.addressSnapshot?.fullName ?? order.user.name}</p>
                      <p>{order.addressSnapshot?.phone ?? order.user.phone}</p>
                      <p>{order.addressSnapshot?.email ?? order.user.email}</p>
                      <p className="mt-2">{[order.addressSnapshot?.line1, order.addressSnapshot?.line2, order.addressSnapshot?.city, order.addressSnapshot?.state, order.addressSnapshot?.postalCode ?? order.addressSnapshot?.pincode].filter(Boolean).join(", ")}</p>
                    </div>
                    {order.cancelRequestReason ? <div className="rounded-2xl bg-amber-50/10 p-3 text-amber-100"><p className="text-xs uppercase tracking-[0.16em] text-amber-200/80">Cancel reason</p><p className="mt-2">{order.cancelRequestReason}</p></div> : null}
                    <div className="grid gap-3 md:grid-cols-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white/5 p-3">
                          <p className="font-medium text-white">{item.productName}</p>
                          <p className="mt-1 text-white/60">SKU {item.productSku}</p>
                          <p className="mt-1 text-white/60">Qty {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Operations</p>
                    <select value={draft?.status ?? order.status} onChange={(event) => setDraftField(order.id, "status", event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink">
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={draft?.paymentStatus ?? order.paymentStatus} onChange={(event) => setDraftField(order.id, "paymentStatus", event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink">
                      {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input value={draft?.shippingCourier ?? ""} onChange={(event) => setDraftField(order.id, "shippingCourier", event.target.value)} placeholder="Courier name" className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                    <input value={draft?.shippingAwb ?? ""} onChange={(event) => setDraftField(order.id, "shippingAwb", event.target.value)} placeholder="AWB / tracking number" className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                    <input type="date" value={draft?.estimatedDeliveryAt ?? ""} onChange={(event) => setDraftField(order.id, "estimatedDeliveryAt", event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                    <textarea value={draft?.adminNotes ?? ""} onChange={(event) => setDraftField(order.id, "adminNotes", event.target.value)} placeholder="Ops note for the customer or internal desk" className="min-h-[110px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                    <button type="button" onClick={() => saveOps(order)} className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90">Save operations</button>
                  </div>
                </div>
              </div>
            );
          })}
          {!orders.length ? <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">No orders match the current search and filters.</div> : null}
          {pagination.pages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={pagination.page === 1} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10">Previous</button>
              {pageNumbers.map((entry) => <button key={entry} type="button" onClick={() => setPage(entry)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${entry === pagination.page ? "bg-white text-ink" : "border border-white/10 text-white hover:bg-white/10"}`}>{entry}</button>)}
              <button type="button" onClick={() => setPage((current) => Math.min(current + 1, pagination.pages))} disabled={pagination.page === pagination.pages} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10">Next</button>
            </div>
          ) : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
