"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { api, getApiErrorMessage } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (!token) return;
    api.post("/auth/verify-email", { token })
      .then(() => toast.success("Email verified. You can now log in."))
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to verify email")));
  }, [token]);

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Verify Email</h1>
          <p className="mt-6 text-sm text-slate">If the verification link is valid, your account will be activated.</p>
          <p className="mt-6 text-sm text-slate">Go to <Link href="/login" className="font-semibold text-accent">Login</Link></p>
        </div>
      </div>
    </PageShell>
  );
}
