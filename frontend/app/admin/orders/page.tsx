"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get("/admin/orders", authHeaders(token)).then((response) => setOrders(response.data));
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Orders">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 text-sm">
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-white/60">{order.user.name} · {order.user.email}</p>
              </div>
              <div className="text-right">
                <p>{order.status}</p>
                <p className="text-white/60">{order.paymentStatus}</p>
              </div>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
