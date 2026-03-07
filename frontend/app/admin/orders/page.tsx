"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<any[]>([]);

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

  return (
    <AdminGuard>
      <AdminShell title="Orders">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {orders.map((order) => (
            <div key={order.id} className="grid gap-4 border-b border-white/10 pb-4 text-sm lg:grid-cols-[1.2fr_1fr_auto]">
              <div className="space-y-1">
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-white/60">{order.user.name} · {order.user.email} · {order.user.phone}</p>
                <p className="text-white/60">
                  {order.items.length} items · INR {Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={order.status}
                  onChange={async (event) => {
                    try {
                      const response = await api.patch(
                        `/admin/orders/${order.id}/status`,
                        { status: event.target.value, paymentStatus: order.paymentStatus },
                        authHeaders(token)
                      );
                      setOrders((current) =>
                        current.map((item) => (item.id === order.id ? response.data : item))
                      );
                      toast.success("Order status updated");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Unable to update order status"));
                    }
                  }}
                  className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                >
                  {["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                    <option key={status} value={status}>{status}</option>
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
                      setOrders((current) =>
                        current.map((item) => (item.id === order.id ? response.data : item))
                      );
                      toast.success("Payment status updated");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Unable to update payment status"));
                    }
                  }}
                  className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                >
                  {["PENDING", "PAID", "FAILED", "REFUNDED", "COD"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
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
                <button
                  type="button"
                  onClick={load}
                  className="text-xs text-white/60 underline"
                >
                  Refresh
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
