"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/lib/utils";

const orderStatuses = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "COD"];

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const load = () => {
    if (!token) return;
    api
      .get("/admin/orders", authHeaders(token))
      .then((response) => setOrders(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load orders"));
      });
  };

  useEffect(() => {
    load();
  }, [token]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.orderNumber.toLowerCase().includes(normalizedQuery) ||
        order.user.name.toLowerCase().includes(normalizedQuery) ||
        order.user.email.toLowerCase().includes(normalizedQuery) ||
        (order.user.phone ?? "").toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "ALL" || order.paymentStatus === paymentFilter;

      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, paymentFilter, query, statusFilter]);

  return (
    <AdminGuard>
      <AdminShell title="Orders">
        <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Order controls</p>
              <p className="text-sm text-white/60">
                {filteredOrders.length} of {orders.length} orders visible
              </p>
            </div>
            <button type="button" onClick={load} className="text-sm text-white/60 underline">
              Refresh list
            </button>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1.5fr_repeat(2,minmax(0,220px))]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order number, customer, email, or phone"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All order statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All payment states</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-white">{order.orderNumber}</p>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      {order.status}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-white/60">{order.user.name} · {order.user.email} · {order.user.phone}</p>
                  <p className="text-white/60">
                    {order.items.length} items · {formatCurrency(Number(order.totalAmount))}
                  </p>
                  <p className="text-white/50">
                    Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, "")}/api/admin/orders/${order.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    Download Invoice
                  </a>
                  <button type="button" onClick={load} className="text-xs text-white/60 underline">
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
                <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Items</p>
                  {order.items.map((item: any) => (
                    <div key={item.id} className="rounded-2xl bg-black/10 p-3">
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="mt-1 text-white/60">SKU {item.productSku}</p>
                      <p className="mt-1 text-white/60">
                        Qty {item.quantity} · {formatCurrency(Number(item.totalPrice))}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Shipping address</p>
                  <div className="text-white/75">
                    <p className="font-medium text-white">{order.addressSnapshot?.fullName ?? order.user.name}</p>
                    <p>{order.addressSnapshot?.phone ?? order.user.phone}</p>
                    <p>{order.addressSnapshot?.email ?? order.user.email}</p>
                    <p className="mt-2">
                      {[
                        order.addressSnapshot?.line1,
                        order.addressSnapshot?.line2,
                        order.addressSnapshot?.city,
                        order.addressSnapshot?.state,
                        order.addressSnapshot?.postalCode ?? order.addressSnapshot?.pincode
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {order.gstNumber ? <p className="mt-2">GSTIN: {order.gstNumber}</p> : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Operations</p>
                  <select
                    value={order.status}
                    onChange={async (event) => {
                      try {
                        const response = await api.patch(
                          `/admin/orders/${order.id}/status`,
                          { status: event.target.value, paymentStatus: order.paymentStatus },
                          authHeaders(token)
                        );
                        setOrders((current) => current.map((item) => (item.id === order.id ? response.data : item)));
                        toast.success("Order status updated");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to update order status"));
                      }
                    }}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    value={order.paymentStatus}
                    onChange={async (event) => {
                      try {
                        const response = await api.patch(
                          `/admin/orders/${order.id}/status`,
                          { status: order.status, paymentStatus: event.target.value },
                          authHeaders(token)
                        );
                        setOrders((current) => current.map((item) => (item.id === order.id ? response.data : item)));
                        toast.success("Payment status updated");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to update payment status"));
                      }
                    }}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <div className="rounded-2xl bg-black/10 p-4 text-white/75">
                    <p>Subtotal: {formatCurrency(Number(order.subtotal))}</p>
                    <p className="mt-1">Discount: {formatCurrency(Number(order.discountAmount))}</p>
                    <p className="mt-1">Shipping: {formatCurrency(Number(order.shippingAmount))}</p>
                    <p className="mt-1">GST: {formatCurrency(Number(order.taxAmount))}</p>
                    <p className="mt-2 font-semibold text-white">Total: {formatCurrency(Number(order.totalAmount))}</p>
                    {order.invoice?.invoiceNumber ? (
                      <p className="mt-2 text-xs text-white/50">Invoice #{order.invoice.invoiceNumber}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!filteredOrders.length ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
              No orders match the current search and filters.
            </div>
          ) : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
