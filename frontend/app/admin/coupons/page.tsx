"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCouponsPage() {
  const token = useAuthStore((state) => state.token);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", value: "10", type: "PERCENTAGE", minOrderValue: "999" });

  const load = async () => {
    try {
      const response = await api.get("/admin/coupons", authHeaders(token));
      setCoupons(response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load coupons"));
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Coupons">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Input placeholder="Code" value={form.code} onChange={(event) => setForm((state) => ({ ...state, code: event.target.value }))} />
            <Input placeholder="Value" value={form.value} onChange={(event) => setForm((state) => ({ ...state, value: event.target.value }))} />
            <select
              value={form.type}
              onChange={(event) => setForm((state) => ({ ...state, type: event.target.value }))}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat</option>
            </select>
            <Input
              placeholder="Min order"
              value={form.minOrderValue}
              onChange={(event) => setForm((state) => ({ ...state, minOrderValue: event.target.value }))}
            />
          </div>
          <Button
            onClick={async () => {
              try {
                await api.post(
                  "/admin/coupons",
                  {
                    code: form.code,
                    type: form.type,
                    value: Number(form.value),
                    minOrderValue: Number(form.minOrderValue),
                    isActive: true
                  },
                  authHeaders(token)
                );
                toast.success("Coupon created");
                load();
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Unable to create coupon"));
              }
            }}
          >
            Add coupon
          </Button>
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex justify-between border-b border-white/10 pb-3 text-sm">
              <span>{coupon.code}</span>
              <span>{coupon.type}</span>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
