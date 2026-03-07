"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emptyForm = {
  code: "",
  description: "",
  value: "10",
  type: "PERCENTAGE",
  minOrderValue: "999",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true
};

export default function AdminCouponsPage() {
  const token = useAuthStore((state) => state.token);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const response = await api.get("/admin/coupons", authHeaders(token));
      setCoupons(response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load coupons"));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Coupons">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Coupon controls</h3>
              <p className="mt-1 text-sm text-white/60">Create, edit, pause, and retire discount rules.</p>
            </div>
            {editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Input placeholder="Code" value={form.code} onChange={(event) => setForm((state) => ({ ...state, code: event.target.value.toUpperCase() }))} />
            <Input placeholder="Description" value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} />
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
            <Input
              placeholder="Max discount"
              value={form.maxDiscount}
              onChange={(event) => setForm((state) => ({ ...state, maxDiscount: event.target.value }))}
            />
            <Input
              placeholder="Usage limit"
              value={form.usageLimit}
              onChange={(event) => setForm((state) => ({ ...state, usageLimit: event.target.value }))}
            />
            <Input
              placeholder="Expiry"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => setForm((state) => ({ ...state, expiresAt: event.target.value }))}
            />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((state) => ({ ...state, isActive: event.target.checked }))}
              />
              Active coupon
            </label>
          </div>
          <Button
            onClick={async () => {
              try {
                const payload = {
                  code: form.code,
                  description: form.description || undefined,
                  type: form.type,
                  value: Number(form.value),
                  minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
                  maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                  usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                  expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
                  isActive: form.isActive
                };

                if (editingId) {
                  await api.put(`/admin/coupons/${editingId}`, payload, authHeaders(token));
                  toast.success("Coupon updated");
                } else {
                  await api.post("/admin/coupons", payload, authHeaders(token));
                  toast.success("Coupon created");
                }

                resetForm();
                load();
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Unable to save coupon"));
              }
            }}
          >
            {editingId ? "Save changes" : "Add coupon"}
          </Button>
          {coupons.map((coupon) => (
            <div key={coupon.id} className="space-y-3 border-b border-white/10 pb-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{coupon.code}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${coupon.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-white/60">
                    {coupon.type} · Value {coupon.value}
                    {coupon.minOrderValue ? ` · Min order ${coupon.minOrderValue}` : ""}
                    {coupon.maxDiscount ? ` · Max ${coupon.maxDiscount}` : ""}
                  </p>
                  <p className="mt-1 text-white/40">
                    Used {coupon.usedCount}/{coupon.usageLimit ?? "unlimited"}
                    {coupon.expiresAt ? ` · Expires ${new Date(coupon.expiresAt).toLocaleString("en-IN")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-cyan-300"
                    onClick={() => {
                      setEditingId(coupon.id);
                      setForm({
                        code: coupon.code,
                        description: coupon.description ?? "",
                        value: String(coupon.value),
                        type: coupon.type,
                        minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
                        maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
                        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
                        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
                        isActive: Boolean(coupon.isActive)
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400"
                    onClick={async () => {
                      try {
                        await api.delete(`/admin/coupons/${coupon.id}`, authHeaders(token));
                        toast.success("Coupon deleted");
                        if (editingId === coupon.id) {
                          resetForm();
                        }
                        load();
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete coupon"));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
