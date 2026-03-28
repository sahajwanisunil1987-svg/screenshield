"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { SponsorAd, SponsorPlacement } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const placements: Array<{ label: string; value: SponsorPlacement }> = [
  { label: "Homepage primary", value: "home_primary" },
  { label: "Footer partner", value: "footer_partner" },
  { label: "Category top", value: "category_top" }
];

const emptyForm = (): SponsorAd => ({
  name: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  targetUrl: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
  placement: "home_primary",
  badge: "Sponsored",
  priority: 10,
  startAt: "",
  endAt: "",
  isActive: true
});

const toDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (item: number) => String(item).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoOrEmpty = (value?: string | null) => (value ? new Date(value).toISOString() : "");

export function AdminSponsorsPage() {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [items, setItems] = useState<SponsorAd[]>([]);
  const [form, setForm] = useState<SponsorAd>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get("/admin/sponsor-ads", authHeaders(token));
      setItems(response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load sponsors"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated || !token) {
      return;
    }

    void load();
  }, [hasHydrated, token]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) =>
      [item.name, item.title, item.placement, item.badge, item.targetUrl].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized)
      )
    );
  }, [items, query]);

  const save = async () => {
    try {
      const payload = {
        ...form,
        priority: Number(form.priority ?? 0),
        startAt: toIsoOrEmpty(form.startAt),
        endAt: toIsoOrEmpty(form.endAt)
      };

      if (editingId) {
        await api.put(`/admin/sponsor-ads/${editingId}`, payload, authHeaders(token));
        toast.success("Sponsor updated");
      } else {
        await api.post("/admin/sponsor-ads", payload, authHeaders(token));
        toast.success("Sponsor created");
      }

      resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save sponsor"));
    }
  };

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Sponsor Ads</h3>
          <p className="mt-1 text-sm text-white/60">Manage direct sponsor slots for homepage, footer, and future placements.</p>
        </div>
        {editingId ? (
          <Button variant="ghost" onClick={resetForm}>
            Cancel edit
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_auto]">
        <Input
          placeholder="Search sponsors by name, title, placement, or link"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="bg-white/95"
        />
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
          {filteredItems.length} of {items.length} visible
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Sponsor name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
        <Input placeholder="CTA label" value={form.ctaLabel} onChange={(event) => setForm((state) => ({ ...state, ctaLabel: event.target.value }))} />
        <Input placeholder="Banner title" value={form.title} onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))} />
        <Input placeholder="Badge (Sponsored / Partner)" value={form.badge ?? ""} onChange={(event) => setForm((state) => ({ ...state, badge: event.target.value }))} />
        <Input
          placeholder="Subtitle / supporting text"
          value={form.subtitle}
          onChange={(event) => setForm((state) => ({ ...state, subtitle: event.target.value }))}
        />
        <Input placeholder="Target URL" value={form.targetUrl} onChange={(event) => setForm((state) => ({ ...state, targetUrl: event.target.value }))} />
        <Input
          placeholder="Desktop image URL (optional)"
          value={form.desktopImageUrl ?? ""}
          onChange={(event) => setForm((state) => ({ ...state, desktopImageUrl: event.target.value }))}
        />
        <Input
          placeholder="Mobile image URL (optional)"
          value={form.mobileImageUrl ?? ""}
          onChange={(event) => setForm((state) => ({ ...state, mobileImageUrl: event.target.value }))}
        />
        <select
          value={form.placement}
          onChange={(event) => setForm((state) => ({ ...state, placement: event.target.value as SponsorPlacement }))}
          className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
        >
          {placements.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Priority"
          value={String(form.priority ?? 0)}
          onChange={(event) => setForm((state) => ({ ...state, priority: Number(event.target.value) }))}
        />
        <Input
          type="datetime-local"
          placeholder="Start at"
          value={toDateTimeLocal(form.startAt)}
          onChange={(event) => setForm((state) => ({ ...state, startAt: event.target.value }))}
        />
        <Input
          type="datetime-local"
          placeholder="End at"
          value={toDateTimeLocal(form.endAt)}
          onChange={(event) => setForm((state) => ({ ...state, endAt: event.target.value }))}
        />
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            checked={Boolean(form.isActive)}
            onChange={(event) => setForm((state) => ({ ...state, isActive: event.target.checked }))}
          />
          <span>
            <span className="block font-medium">Active</span>
            <span className="block text-xs text-white/55">Turns the sponsor on or off. Start/end dates can still keep it hidden.</span>
          </span>
        </label>
      </div>

      <Button onClick={save}>{editingId ? "Save sponsor" : "Add sponsor"}</Button>

      <div className="space-y-3 text-sm">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)
          : filteredItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      {item.placement.replace("_", " ")}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        item.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-white/80">{item.title}</p>
                  <p className="text-white/60">{item.subtitle}</p>
                  <p className="text-white/45">
                    Priority {item.priority ?? 0} • Clicks {item.clickCount ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-cyan-300"
                    onClick={() => {
                      setEditingId(item.id ?? null);
                      setForm({
                        ...item,
                        startAt: item.startAt ?? "",
                        endAt: item.endAt ?? ""
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400"
                    onClick={async () => {
                      const confirmed = window.confirm(`Delete sponsor "${item.name}"? This action cannot be undone.`);
                      if (!confirmed) {
                        return;
                      }
                      try {
                        await api.delete(`/admin/sponsor-ads/${item.id}`, authHeaders(token));
                        toast.success("Sponsor deleted");
                        await load();
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete sponsor"));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
