"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.token);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/users", authHeaders(token))
      .then((response) => setUsers(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load users"));
      });
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Users">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {users.map((user) => (
            <div key={user.id} className="space-y-4 border-b border-white/10 pb-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-white/60">{user.email}</p>
                  <p className="mt-1 text-white/40">{user.phone ?? "No phone added"}</p>
                </div>
                <span>{user.orders.length} orders</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {user.orders.slice(0, 4).map((order: any) => (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <p className="font-medium text-white">{order.orderNumber}</p>
                    <p className="mt-1 text-white/60">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    <p className="mt-1 text-white/60">{order.status} · {order.paymentStatus}</p>
                  </div>
                ))}
              </div>
              {!user.orders.length ? (
                <p className="text-white/40">No orders yet</p>
              ) : null}
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
