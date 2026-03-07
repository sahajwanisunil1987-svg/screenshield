"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type ResourceManagerProps = {
  title: string;
  getUrl: string;
  createUrl: string;
  deleteBaseUrl: string;
  fields: Array<{ key: string; placeholder: string }>;
};

export function ResourceManager({ title, getUrl, createUrl, deleteBaseUrl, fields }: ResourceManagerProps) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await api.get(getUrl, authHeaders(token));
      setItems(response.data.items ?? response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to load ${title.toLowerCase()}`));
    }
  };

  useEffect(() => {
    if (!hasHydrated || !token) {
      return;
    }

    load();
  }, [getUrl, hasHydrated, token]);

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <h3 className="font-semibold">{title}</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {fields.map((field) => (
          <Input
            key={field.key}
            placeholder={field.placeholder}
            value={form[field.key] ?? ""}
            onChange={(event) => setForm((state) => ({ ...state, [field.key]: event.target.value }))}
          />
        ))}
      </div>
      <Button
        onClick={async () => {
          try {
            await api.post(createUrl, { ...form, isActive: true }, authHeaders(token));
            toast.success(`${title} created`);
            setForm({});
            load();
          } catch (error) {
            toast.error(getApiErrorMessage(error, `Unable to create ${title.toLowerCase()}`));
          }
        }}
      >
        Add
      </Button>
      <div className="space-y-3 text-sm">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-white/10 pb-3">
            <span>{item.name ?? item.code}</span>
            <button
              className="text-red-400"
              onClick={async () => {
                try {
                  await api.delete(`${deleteBaseUrl}/${item.id}`, authHeaders(token));
                  toast.success("Deleted");
                  load();
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Unable to delete item"));
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
