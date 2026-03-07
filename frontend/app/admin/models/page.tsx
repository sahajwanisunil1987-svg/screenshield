"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminModelsPage() {
  const token = useAuthStore((state) => state.token);
  const [models, setModels] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", brandId: "" });

  const load = async () => {
    try {
      const [modelsResponse, brandsResponse] = await Promise.all([api.get("/models"), api.get("/brands")]);
      setModels(modelsResponse.data);
      setBrands(brandsResponse.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load models"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminGuard>
      <AdminShell title="Models">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input placeholder="Model name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <select
              value={form.brandId}
              onChange={(event) => setForm((state) => ({ ...state, brandId: event.target.value }))}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <Button
              onClick={async () => {
                try {
                  await api.post("/admin/models", { ...form, isActive: true }, authHeaders(token));
                  setForm({ name: "", brandId: "" });
                  toast.success("Model created");
                  load();
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Unable to create model"));
                }
              }}
            >
              Add model
            </Button>
          </div>
          {models.map((model) => (
            <div key={model.id} className="flex justify-between border-b border-white/10 pb-3 text-sm">
              <span>{model.name}</span>
              <button
                className="text-red-400"
                onClick={async () => {
                  try {
                    await api.delete(`/admin/models/${model.id}`, authHeaders(token));
                    toast.success("Model deleted");
                    load();
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, "Unable to delete model"));
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
