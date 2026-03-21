"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MapPin, Package, ShieldCheck, Bell, Plus } from "lucide-react";
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

  const defaultAddress = useMemo(() => addresses.find((address) => address.isDefault) ?? null, [addresses]);
  const quickActions = [
    { href: "/my-orders", label: "My Orders", icon: Package },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/track-order", label: "Track Order", icon: MapPin },
    { href: "/products", label: "Browse Parts", icon: Plus }
  ];

  const startEditingAddress = (address: Address) => {
    setEditingId(address.id);
    setDraft({
      ...address,
      line2: address.line2 ?? "",
      landmark: address.landmark ?? "",
      gstNumber: address.gstNumber ?? ""
    });
  };

  const cancelAddressEdit = () => {
    setEditingId(null);
    setDraft(emptyAddress);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="theme-surface rounded-[32px] p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Customer account</p>
              <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Manage profile, addresses, and checkout details</h1>
              <p className="mt-3 text-sm leading-6 text-slate sm:text-base">
                Keep your contact details current so invoices, delivery updates, and support requests stay aligned across every order.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <div className="rounded-[24px] border border-slate-200/80 bg-panel p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Saved addresses</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{addresses.length}</p>
                <p className="mt-1 text-sm text-slate">{defaultAddress ? "Default address ready for checkout" : "Add a default address"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-panel p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Account email</p>
                <p className="mt-2 truncate text-base font-semibold text-ink">{user?.email ?? "Loading..."}</p>
                <p className="mt-1 text-sm text-slate">Used for order updates and verification</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-panel px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accentSoft"
              >
                <action.icon className="h-4.5 w-4.5 text-accent" />
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <form onSubmit={saveProfile} className="theme-surface rounded-[32px] p-6 shadow-card sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Profile</p>
            <h2 className="mt-3 font-display text-3xl text-ink">Contact details</h2>
            <p className="mt-2 text-sm text-slate">These details are reused across checkout, invoices, and after-sales support.</p>

            <div className="mt-6 grid gap-4 rounded-[28px] bg-panel p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Primary contact</p>
                <div className="mt-3 space-y-4">
                  <Input
                    placeholder="Full name"
                    value={profile.name}
                    onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  />
                  <Input placeholder="Email" value={user?.email ?? ""} readOnly />
                  <Input
                    placeholder="Phone"
                    value={profile.phone}
                    onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200/80 bg-panel p-4 text-sm text-slate">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4.5 w-4.5 text-accent" />
                  <div>
                    <p className="font-semibold text-ink">Profile details stay in sync</p>
                    <p className="mt-1 leading-6 text-slate">Your saved name and phone help speed up checkout, invoice generation, and support follow-up.</p>
                  </div>
                </div>
              </div>
            </div>

            <Button className="mt-6 w-full">Save profile</Button>
          </form>

          <div className="theme-surface rounded-[32px] p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Address book</p>
                <h2 className="mt-3 font-display text-3xl text-ink">Saved delivery addresses</h2>
                <p className="mt-2 text-sm text-slate">Choose a default address for faster checkout and more reliable invoice details.</p>
              </div>
              <span className="w-fit rounded-full bg-accentSoft px-3 py-2 text-xs font-semibold text-accent">{addresses.length} saved</span>
            </div>

            <div className="mt-6 grid gap-4">
              {addresses.length ? (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-[24px] border border-slate-200 bg-panel p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{address.fullName}</p>
                          {address.isDefault ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate">
                          {[address.line1, address.line2, address.landmark, address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                        </p>
                        <p className="mt-1.5 text-sm text-slate">{address.phone}</p>
                        {address.gstNumber ? <p className="mt-1.5 text-sm text-slate">GST: {address.gstNumber}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingAddress(address)}
                          className="rounded-full border border-slate-200/80 bg-panel px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent/25 hover:bg-accentSoft"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAddress(address.id)}
                          className="rounded-full border border-red-200/80 bg-panel px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-panel p-6 text-sm text-slate">
                  <p className="font-semibold text-ink">No saved addresses yet.</p>
                  <p className="mt-2 leading-6">Add a delivery address to make checkout faster and keep invoices aligned with your order details.</p>
                </div>
              )}
            </div>

            <form onSubmit={saveAddress} className="mt-6 rounded-[28px] bg-panel p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{editingId ? "Edit address" : "Add a new address"}</p>
                  <p className="mt-1 text-sm text-slate">Separate recipient details from location details for easier updates.</p>
                </div>
                {editingId ? (
                  <span className="rounded-full border border-accent/20 bg-accentSoft px-3 py-1.5 text-xs font-semibold text-accent">Editing current address</span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Recipient</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Input placeholder="Full name" value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
                    <Input placeholder="Phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Address</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Input placeholder="Address line 1" value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} />
                    <Input placeholder="Address line 2" value={draft.line2} onChange={(event) => setDraft((current) => ({ ...current, line2: event.target.value }))} />
                    <Input placeholder="Landmark" value={draft.landmark} onChange={(event) => setDraft((current) => ({ ...current, landmark: event.target.value }))} />
                    <Input placeholder="City" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
                    <Input placeholder="State" value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} />
                    <Input placeholder="Postal code" value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} />
                    <Input placeholder="Country" value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} />
                    <Input placeholder="GST number" value={draft.gstNumber} onChange={(event) => setDraft((current) => ({ ...current, gstNumber: event.target.value }))} />
                  </div>
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-slate">
                <input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft((current) => ({ ...current, isDefault: event.target.checked }))} />
                Set as default address for checkout
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="submit">{editingId ? "Update address" : "Save address"}</Button>
                {editingId ? (
                  <Button type="button" variant="secondary" onClick={cancelAddressEdit}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
