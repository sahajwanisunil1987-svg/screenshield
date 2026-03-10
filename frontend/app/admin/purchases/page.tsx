"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Product, PurchaseEntry, Vendor } from "@/types";

type PurchasesResponse = {
  range: "7d" | "30d" | "90d";
  vendors: Vendor[];
  items: PurchaseEntry[];
  summary: {
    totalSpend: number;
    totalUnits: number;
    activeVendors: number;
    averageUnitCost: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export default function AdminPurchasesPage() {
  const token = useAuthStore((state) => state.token);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<PurchasesResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingVendor, setSavingVendor] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: "", contactName: "", email: "", phone: "", gstin: "", address: "" });
  const [purchaseForm, setPurchaseForm] = useState({ vendorId: "", productId: "", quantity: "1", unitCost: "", invoiceRef: "", notes: "" });

  const load = () => {
    if (!token) return;
    setIsLoading(true);
    Promise.all([
      api.get<PurchasesResponse>("/admin/purchases", { ...authHeaders(token), params: { range } }),
      api.get<{ items: Product[] }>("/products", { params: { limit: 40 } })
    ])
      .then(([purchaseResponse, productResponse]) => {
        setData(purchaseResponse.data);
        setProducts(productResponse.data.items);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load purchases")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, [range, token]);

  const summaryCards = useMemo(() => [
    { label: "Purchase Spend", value: formatCurrency(data?.summary.totalSpend ?? 0), detail: "Vendor-side buying across selected range" },
    { label: "Units Inward", value: `${data?.summary.totalUnits ?? 0}`, detail: "Total units moved into stock" },
    { label: "Active Vendors", value: `${data?.summary.activeVendors ?? 0}`, detail: "Vendors available for new purchase entries" },
    { label: "Avg Unit Cost", value: formatCurrency(data?.summary.averageUnitCost ?? 0), detail: "Average buying cost per unit in selected range" }
  ], [data]);

  const createVendor = async () => {
    if (!token) return;
    try {
      setSavingVendor(true);
      await api.post("/admin/vendors", vendorForm, authHeaders(token));
      toast.success("Vendor created");
      setVendorForm({ name: "", contactName: "", email: "", phone: "", gstin: "", address: "" });
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create vendor"));
    } finally {
      setSavingVendor(false);
    }
  };

  const createPurchase = async () => {
    if (!token) return;
    try {
      setSavingPurchase(true);
      await api.post("/admin/purchases", {
        vendorId: purchaseForm.vendorId,
        productId: purchaseForm.productId,
        quantity: Number(purchaseForm.quantity),
        unitCost: Number(purchaseForm.unitCost),
        invoiceRef: purchaseForm.invoiceRef || undefined,
        notes: purchaseForm.notes || undefined
      }, authHeaders(token));
      toast.success("Purchase entry added and stock updated");
      setPurchaseForm({ vendorId: purchaseForm.vendorId, productId: "", quantity: "1", unitCost: "", invoiceRef: "", notes: "" });
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create purchase"));
    } finally {
      setSavingPurchase(false);
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Purchases">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="mt-3 font-display text-4xl text-white">{isLoading ? "..." : card.value}</p>
              <p className="mt-2 text-xs text-white/45">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold text-white">New vendor</h3>
            <div className="mt-4 grid gap-3">
              <input value={vendorForm.name} onChange={(e) => setVendorForm((s) => ({ ...s, name: e.target.value }))} placeholder="Vendor name" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <input value={vendorForm.contactName} onChange={(e) => setVendorForm((s) => ({ ...s, contactName: e.target.value }))} placeholder="Contact name" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={vendorForm.email} onChange={(e) => setVendorForm((s) => ({ ...s, email: e.target.value }))} placeholder="Email" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
                <input value={vendorForm.phone} onChange={(e) => setVendorForm((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              </div>
              <input value={vendorForm.gstin} onChange={(e) => setVendorForm((s) => ({ ...s, gstin: e.target.value }))} placeholder="GSTIN" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <textarea value={vendorForm.address} onChange={(e) => setVendorForm((s) => ({ ...s, address: e.target.value }))} placeholder="Address" rows={3} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <button type="button" onClick={createVendor} disabled={savingVendor || !vendorForm.name.trim()} className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {savingVendor ? "Saving..." : "Create Vendor"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">Stock inward entry</h3>
                <p className="mt-1 text-sm text-white/50">Record a purchase and push units into inventory in one step.</p>
              </div>
              <div className="flex gap-2">
                {(["7d", "30d", "90d"] as const).map((entry) => (
                  <button key={entry} type="button" onClick={() => setRange(entry)} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${range === entry ? "bg-white text-ink" : "border border-white/10 text-white/75"}`}>
                    {entry}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select value={purchaseForm.vendorId} onChange={(e) => setPurchaseForm((s) => ({ ...s, vendorId: e.target.value }))} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
                <option value="">Select vendor</option>
                {data?.vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
              <select value={purchaseForm.productId} onChange={(e) => setPurchaseForm((s) => ({ ...s, productId: e.target.value }))} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
              </select>
              <input type="number" min="1" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm((s) => ({ ...s, quantity: e.target.value }))} placeholder="Quantity" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <input type="number" min="0" step="0.01" value={purchaseForm.unitCost} onChange={(e) => setPurchaseForm((s) => ({ ...s, unitCost: e.target.value }))} placeholder="Unit cost" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <input value={purchaseForm.invoiceRef} onChange={(e) => setPurchaseForm((s) => ({ ...s, invoiceRef: e.target.value }))} placeholder="Invoice / bill reference" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <input value={purchaseForm.notes} onChange={(e) => setPurchaseForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Notes" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
            </div>
            <button type="button" onClick={createPurchase} disabled={savingPurchase || !purchaseForm.vendorId || !purchaseForm.productId || !purchaseForm.unitCost} className="mt-4 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {savingPurchase ? "Saving..." : "Add Purchase Entry"}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-semibold text-white">Recent purchases</h3>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)
            ) : data?.items.length ? (
              data.items.map((entry) => (
                <div key={entry.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4 text-white/80">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{entry.product.name}</p>
                      <p className="mt-1 text-white/50">{entry.vendor.name} · {entry.product.sku}</p>
                      <p className="mt-1 text-xs text-white/40">{formatDate(entry.purchasedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">{formatCurrency(entry.totalCost)}</p>
                      <p className="mt-1 text-xs text-white/45">{entry.quantity} units · {formatCurrency(entry.unitCost)} each</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs text-white/55">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Brand / Model</p>
                      <p className="mt-1 text-sm font-semibold text-white">{entry.product.brand.name} · {entry.product.model.name}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Stock now</p>
                      <p className="mt-1 text-sm font-semibold text-white">{entry.product.inventory?.stock ?? entry.product.stock}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Bill ref</p>
                      <p className="mt-1 text-sm font-semibold text-white">{entry.invoiceRef ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-white/35">Notes</p>
                      <p className="mt-1 text-sm font-semibold text-white">{entry.notes ?? "-"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                No purchase entries in this range yet.
              </p>
            )}
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
