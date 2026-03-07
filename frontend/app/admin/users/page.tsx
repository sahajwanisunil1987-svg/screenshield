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
            <div key={user.id} className="flex justify-between border-b border-white/10 pb-4 text-sm">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-white/60">{user.email}</p>
              </div>
              <span>{user.orders.length} orders</span>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
