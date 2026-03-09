"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { Address, User } from "@/types";
import { useAuthStore } from "@/store/auth-store";

const emptyAddress = {
  fullName: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  phone: "",
  gstNumber: "",
  isDefault: false
};

export default function AccountPage() {
  useAuthGuard("CUSTOMER");
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<User>("/account/profile", authHeaders(token))
      .then((response) => {
        setProfile({
          name: response.data.name,
          phone: response.data.phone ?? ""
        });
        setAddresses(response.data.addresses ?? []);
        setAuth(token, response.data);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load account")));
  }, [setAuth, token]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      const response = await api.patch<User>("/account/profile", profile, authHeaders(token));
      setAuth(token, response.data);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update profile"));
    }
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      const response = editingId
        ? await api.patch<Address>(`/account/addresses/${editingId}`, draft, authHeaders(token))
        : await api.post<Address>("/account/addresses", draft, authHeaders(token));

      setAddresses((current) => {
        const next = editingId
          ? current.map((item) => (item.id === editingId ? response.data : item))
          : [response.data, ...current];
        return response.data.isDefault
          ? next.map((item) => ({ ...item, isDefault: item.id === response.data.id }))
          : next;
      });
      setDraft(emptyAddress);
      setEditingId(null);
      toast.success(editingId ? "Address updated" : "Address added");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save address"));
    }
  };

  const removeAddress = async (id: string) => {
    if (!token) return;
    try {
      await api.delete(`/account/addresses/${id}`, authHeaders(token));
      setAddresses((current) => current.filter((item) => item.id !== id));
      toast.success("Address removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to remove address"));
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end"><Link href="/notifications" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white">Notifications</Link></div>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={saveProfile} className="rounded-[32px] bg-white p-8 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Account profile</p>
            <h1 className="mt-3 font-display text-3xl text-ink">Manage profile</h1>
            <p className="mt-2 text-sm text-slate">Update the contact details used across checkout, invoices, and support.</p>
            <div className="mt-6 space-y-4">
              <Input placeholder="Full name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Email" value={user?.email ?? ""} readOnly />
              <Input placeholder="Phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <Button className="mt-6 w-full">Save profile</Button>
          </form>

          <div className="rounded-[32px] bg-white p-8 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Saved addresses</p>
                <h2 className="mt-3 font-display text-3xl text-ink">Address book</h2>
              </div>
              <span className="rounded-full bg-accentSoft px-3 py-2 text-xs font-semibold text-accent">{addresses.length} saved</span>
            </div>
            <div className="mt-6 grid gap-4">
              {addresses.map((address) => (
                <div key={address.id} className="rounded-[24px] border border-slate-200 bg-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{address.fullName}</p>
                      <p className="mt-1 text-sm text-slate">{[address.line1, address.line2, address.landmark, address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
                      <p className="mt-1 text-sm text-slate">{address.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      {address.isDefault ? <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Default</span> : null}
                      <button type="button" onClick={() => { setEditingId(address.id); setDraft({ ...address, line2: address.line2 ?? "", landmark: address.landmark ?? "", gstNumber: address.gstNumber ?? "" }); }} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-ink">Edit</button>
                      <button type="button" onClick={() => removeAddress(address.id)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {!addresses.length ? <p className="rounded-[24px] border border-dashed border-slate-200 p-6 text-sm text-slate">No saved addresses yet.</p> : null}
            </div>

            <form onSubmit={saveAddress} className="mt-6 rounded-[28px] bg-panel p-5">
              <p className="text-sm font-semibold text-ink">{editingId ? "Edit address" : "Add address"}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input placeholder="Full name" value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
                <Input placeholder="Phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
                <Input placeholder="Address line 1" value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} />
                <Input placeholder="Address line 2" value={draft.line2} onChange={(event) => setDraft((current) => ({ ...current, line2: event.target.value }))} />
                <Input placeholder="Landmark" value={draft.landmark} onChange={(event) => setDraft((current) => ({ ...current, landmark: event.target.value }))} />
                <Input placeholder="City" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
                <Input placeholder="State" value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} />
                <Input placeholder="Postal code" value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} />
                <Input placeholder="Country" value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} />
                <Input placeholder="GST number" value={draft.gstNumber} onChange={(event) => setDraft((current) => ({ ...current, gstNumber: event.target.value }))} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-slate">
                <input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft((current) => ({ ...current, isDefault: event.target.checked }))} />
                Set as default address
              </label>
              <div className="mt-4 flex gap-3">
                <Button type="submit">{editingId ? "Update address" : "Save address"}</Button>
                {editingId ? <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setDraft(emptyAddress); }}>Cancel</Button> : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
