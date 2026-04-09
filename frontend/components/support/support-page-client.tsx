"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const issueTypes = [
  { value: "ORDER_ISSUE", label: "Order issue" },
  { value: "RETURN_ISSUE", label: "Return issue" },
  { value: "PAYMENT_ISSUE", label: "Payment issue" },
  { value: "PRODUCT_INQUIRY", label: "Product inquiry" },
  { value: "OTHER", label: "Other" }
] as const;

export function SupportPageClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "",
    kind: "OTHER",
    message: ""
  });

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    try {
      setIsSubmitting(true);
      await api.post("/support/tickets", form);
      toast.success("Support request submitted. Our team will review it shortly.");
      setForm({ name: "", email: "", phone: "", orderNumber: "", subject: "", kind: "OTHER", message: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit support request"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200">Customer support</p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Raise a support request</h1>
          <p className="mt-5 max-w-3xl text-base text-white/75 sm:text-lg">
            Use this form for order help, return questions, payment concerns, or product compatibility guidance. Include your order number whenever possible.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Support desk</p>
            <h2 className="mt-3 font-display text-2xl text-ink">What to include</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate sm:text-base">
            <p>Use the same email you used for your PurjiX order so the team can trace the request faster.</p>
            <p>For returns, payments, or shipment delays, add the order number and describe the issue clearly.</p>
            <p>You can also reach the team directly at <strong>support@gmail.com.</strong> or <strong>+91 9351543131</strong>.</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Full name" />
            <Input value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="Email address" type="email" />
            <Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="Phone number" />
            <Input value={form.orderNumber} onChange={(event) => setField("orderNumber", event.target.value)} placeholder="Order number (optional)" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
            <select value={form.kind} onChange={(event) => setField("kind", event.target.value)} className="rounded-2xl border border-slate-200 bg-panel px-4 py-3 text-sm text-ink">
              {issueTypes.map((entry) => (
                <option key={entry.value} value={entry.value}>{entry.label}</option>
              ))}
            </select>
            <Input value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Subject" />
          </div>
          <textarea
            value={form.message}
            onChange={(event) => setField("message", event.target.value)}
            placeholder="Describe the issue clearly so the operations team can help quickly."
            className="mt-4 min-h-[180px] w-full rounded-[24px] border border-slate-200 bg-panel px-4 py-3 text-sm text-ink"
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate">You will receive an acknowledgement email if mail delivery is configured.</p>
            <Button disabled={isSubmitting} onClick={submit}>{isSubmitting ? "Submitting..." : "Submit request"}</Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
