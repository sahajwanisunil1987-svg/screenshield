"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";

type VerificationState = "idle" | "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerificationState>(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    setState("loading");
    api.post("/auth/verify-email", { token })
      .then(() => {
        setState("success");
        toast.success("Email verified. You can now log in.");
      })
      .catch((error) => {
        setState("error");
        toast.error(getApiErrorMessage(error, "Unable to verify email"));
      });
  }, [token]);

  const message =
    state === "loading"
      ? "Verifying your email..."
      : state === "success"
        ? "Your email has been verified. You can now log in."
        : "This verification link is invalid or expired.";

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Verify Email</h1>
          <p className="mt-6 text-sm text-slate">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
            {state === "error" ? (
              <Link href="/login">
                <Button variant="secondary">Resend verification</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
